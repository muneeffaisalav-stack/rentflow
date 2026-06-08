
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, getDocs } from 'firebase/firestore';
import { Tenant, Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

/**
 * Background component that automatically generates invoices when the due date is reached.
 * Runs on the client side when a landlord is active.
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

        // 1. Fetch all active tenants for this landlord
        const tenantsSnap = await getDocs(
          query(
            collection(db, "tenants"),
            where("landlordId", "==", user.uid),
            where("status", "==", "active")
          )
        );
        const tenants = tenantsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Tenant));

        // 2. Fetch all invoices for the current month to check for duplicates
        const invoicesSnap = await getDocs(
          query(
            collection(db, "invoices"),
            where("landlordId", "==", user.uid),
            where("month", "==", currentMonth)
          )
        );
        const existingInvoiceTenantIds = new Set(invoicesSnap.docs.map(d => d.data().tenantId));

        let generatedCount = 0;

        // 3. Check each tenant
        for (const tenant of tenants) {
          // If today is on or after due date AND no invoice exists for this month
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

            await addDoc(collection(db, "invoices"), invoiceData);
            generatedCount++;
          }
        }

        if (generatedCount > 0) {
          toast({
            title: "Automation Complete",
            description: `Generated ${generatedCount} new invoices for this billing cycle.`,
          });
        }
        
        setHasRun(true);
      } catch (error) {
        console.error("Automation error:", error);
      }
    }

    runAutomation();
  }, [user, db, hasRun, toast]);

  return null;
}
