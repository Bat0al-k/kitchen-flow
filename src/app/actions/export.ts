"use server";

import { getAllOrders } from "./orders";

export async function exportOrdersToCSV() {
    const orders = await getAllOrders();
    
    // إدراج أعمدة فارغة بين العناوين لسهولة القراءة
    const headers = [
        "ORDER ID", "",
        "TABLE #", "",
        "ITEMS", "",
        "STATUS", "",
        "CREATED AT", "",
        "PREP TIME (MIN)", "",
        "DELIVERY TIME (MIN)", "",
        "TIMESTAMPS HISTORY"
    ];

    const rows = orders.map(o => {
        const prepTime = o.acceptedAt && o.readyAt 
            ? Math.round((new Date(o.readyAt).getTime() - new Date(o.acceptedAt).getTime()) / (1000 * 60)) 
            : "N/A";
            
        const deliveryTime = o.readyAt && o.completedAt 
            ? Math.round((new Date(o.completedAt).getTime() - new Date(o.readyAt).getTime()) / (1000 * 60)) 
            : "N/A";

        const formatDate = (d?: string) => d ? new Date(d).toLocaleString('en-GB', { hour12: true }) : "";

        // إدراج قيم فارغة بين البيانات لتتوافق مع الأعمدة الفارغة في الهيدر
        return [
            o._id, "",
            o.tableNumber, "",
            `"${o.items.replace(/"/g, '""')}"`, "",
            o.status, "",
            formatDate(o.createdAt), "",
            prepTime, "",
            deliveryTime, "",
            `"Accepted: ${formatDate(o.acceptedAt)} | Ready: ${formatDate(o.readyAt)} | Completed: ${formatDate(o.completedAt)}"`
        ];
    });

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    return csvContent;
}
