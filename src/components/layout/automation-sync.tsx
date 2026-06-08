
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import { Tenant, Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

/**
 * Robust background sync component that identifies and creates missing invoices.
 * Acts as a lightweight "backend process" that runs securely under the user's session.
 */
export function AutomationSync() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    async function runAutomation() {
      if (!user || !db || hasRun) return;

      try {
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
        const currentDay = now.getDate();

        // 1. Fetch only active tenants for THIS landlord (Security Requirement)
        const tenantsSnap = await getDocs(
          query(
            collection(db, "tenants"),
            where("landlordId", "==", user.uid),
            where("status", "==", "active")
          )
        );
        
        if (tenantsSnap.empty) {
          setHasRun(true);
          return;
        }

        const tenants = tenantsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Tenant));

        // 2. Fetch all invoices for THIS landlord and THIS month to avoid duplicates
        const invoicesSnap = await getDocs(
          query(
            collection(db, "invoices"),
            where("landlordId", "==", user.uid),
            where("month", "==", currentMonth)
          )
        );
        const existingInvoiceTenantIds = new Set(invoicesSnap.docs.map(d => d.data().tenantId));

        let generatedCount = 0;

        // 3. Automated Generation Logic
        for (const tenant of tenants) {
          // Rule: If today >= due date AND no invoice exists for this month, generate it.
          if (currentDay >= tenant.dueDate && !existingInvoiceTenantIds.has(tenant.id)) {
            const invoiceData = {
              tenantId: tenant.id,
              propertyId: tenant.propertyId,
              landlordId: user.uid,
              month: currentMonth,
              amount: tenant.rentAmount,
              status: 'pending',
              createdAt: new Date().toISOString(),
            };

            // Use addDoc for standard auto-generation
            await addDoc(collection(db, "invoices"), invoiceData);
            generatedCount++;
          }
        }

        if (generatedCount > 0) {
          toast({
            title: "Automated Billing Complete",
            description: `Successfully generated ${generatedCount} new invoices for ${currentMonth}.`,
          });
        }
        
        setHasRun(true);
      } catch (error) {
        // Silently log automation errors to avoid disrupting user experience
        console.warn("Automation background process encountered an error:", error);
      }
    }

    // Delay start slightly to ensure profile sync is complete
    const timer = setTimeout(runAutomation, 2000);
    return () => clearTimeout(timer);
  }, [user, db, hasRun, toast]);

  return null;
}
