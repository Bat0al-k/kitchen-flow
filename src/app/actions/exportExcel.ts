"use server";

import { getAllOrders } from "./orders";
import ExcelJS from "exceljs";

export async function exportOrdersToExcel() {
    const orders = await getAllOrders();
    
    // Create Workbook and Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("KitchenFlow Reports");

    // Define Columns with Widths
    worksheet.columns = [
        { header: "ORDER ID", key: "id", width: 30 },
        { header: "TABLE #", key: "table", width: 12 },
        { header: "ITEMS", key: "items", width: 40 },
        { header: "STATUS", key: "status", width: 15 },
        { header: "CREATED AT", key: "createdAt", width: 25 },
        { header: "PREP (MIN)", key: "prepTime", width: 15 },
        { header: "DELIVERY (MIN)", key: "deliveryTime", width: 18 },
        { header: "TIMESTAMPS HISTORY", key: "history", width: 50 },
    ];

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1E293B" }, // Dark Blue/Zinc-900
        };
        cell.font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
            size: 11,
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
            bottom: { style: "thin", color: { argb: "FF475569" } }
        };
    });

    // Add Data Rows
    orders.forEach((o) => {
        const prepTime = o.acceptedAt && o.readyAt 
            ? Math.round((new Date(o.readyAt).getTime() - new Date(o.acceptedAt).getTime()) / (1000 * 60)) 
            : "N/A";
            
        const deliveryTime = o.readyAt && o.completedAt 
            ? Math.round((new Date(o.completedAt).getTime() - new Date(o.readyAt).getTime()) / (1000 * 60)) 
            : "N/A";

        const formatDate = (d?: string) => d ? new Date(d).toLocaleString('en-GB', { hour12: true }) : "-";

        const history = [
            `Accepted: ${formatDate(o.acceptedAt)}`,
            `Ready: ${formatDate(o.readyAt)}`,
            `Completed: ${formatDate(o.completedAt)}`
        ].join("\n");

        const row = worksheet.addRow({
            id: o._id,
            table: o.tableNumber,
            items: o.items,
            status: o.status,
            createdAt: formatDate(o.createdAt),
            prepTime: prepTime,
            deliveryTime: deliveryTime,
            history: history,
        });

        // Alignment & Wrapping
        row.getCell("items").alignment = { wrapText: true, vertical: "middle" };
        
        const historyCell = row.getCell("history");
        historyCell.alignment = { wrapText: true, vertical: "middle" };
        historyCell.font = { size: 9, color: { argb: "FF64748B" } }; // Slate-500

        row.eachCell((cell, colNumber) => {
            const columnKey = worksheet.columns[colNumber - 1]?.key;

            cell.alignment = {
                ...cell.alignment,
                vertical: "middle",
                horizontal: "center"
            };

            if (
                columnKey !== "items" &&
                columnKey !== "history" &&
                columnKey !== "id"
            ) {
                cell.alignment = {
                    ...cell.alignment,
                    horizontal: "center",
                };
            }
        });

        // Status Colors
        const statusCell = row.getCell("status");
        let statusColor = "FF94A3B8"; // Default Zinc
        if (o.status === "PENDING") statusColor = "FFFACC15"; // Yellow
        if (o.status === "COOKING") statusColor = "FF60A5FA"; // Blue
        if (o.status === "READY" || o.status === "COMPLETED") statusColor = "FF4ADE80"; // Green
        if (o.status === "CANCELLED") statusColor = "FFF87171"; // Red

        statusCell.font = { bold: true, color: { argb: statusColor } };
    });

    // Final Styling (Borders and Zebra Stripes for readability)
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            row.height = 45; // Generous height for multiline content
            
            const isEven = rowNumber % 2 === 0;

            row.eachCell((cell) => {
                // Apply Zebra stripes
                if (isEven) {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF9FAFB" } // Very light gray
                    };
                }

                cell.border = {
                    bottom: { style: "thin", color: { argb: "FFF1F5F9" } }
                };
            });
        }
    });

    // Generate Buffer and Convert to Base64
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer).toString("base64");
}
