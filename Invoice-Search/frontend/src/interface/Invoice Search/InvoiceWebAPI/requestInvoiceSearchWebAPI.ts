// Interface Imports  
import { sendCustomTraceLog } from "@/interface/sendLog/sendLog";

export const requestInvoiceSearchWebAPI = async (invoiceNum: string[], user: string) => {
    try {
        const requestBody = {
            userId: user,
            invoiceNum: invoiceNum,
            isDebug: import.meta.env.MODE === "development" ? true : false
        }

        const response = await fetch(
            import.meta.env.VITE_APP_API_URL + "api/invoicesearch_webapi",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody)
            }
        )

        if (!response.ok) {
            sendCustomTraceLog(
                "Network response was not ok: " + response.text,
                user,
                "ERROR",
                "requestInvoiceSearch.ts",
            );
            return;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        sendCustomTraceLog(
            "There was an error while requesting invoice search: " + error,
            user,
            "ERROR",
            "requestInvoiceSearch.ts",
        );
        return;
    }
}  
