document.addEventListener("DOMContentLoaded", async function () {
    let sessionId = sessionStorage.getItem("session_token");
    if (!sessionId) {
        sessionId = "guest_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
        sessionStorage.setItem("session_token", sessionId);
    }

    // === Visitor Count ===
    try {
        // Step 1: Call increment_unique_session
        const payloadIncrement = {
            action: "function_call",
            function_name: "increment_unique_session",
            params: {
                session_token: sessionId
            }
        };

        const responseIncrement = await $.ajax({
            url: `${BASE_API_URL}/commonfunction`,
            method: "POST",
            headers: {
                "X-APP-Key": "tnreat",
                "X-APP-Name": "tnreat"
            },
            data: {
                data: encryptData(payloadIncrement)
            },
            dataType: "json",
        });

        const decryptedIncrement = decryptData(responseIncrement?.data || "");

        console.log("Increment Response:", decryptedIncrement);

        // Get latest session count (from increment API)
        let latestCount = null;
        if (Array.isArray(decryptedIncrement) && decryptedIncrement[0]?.increment_unique_session) {
            latestCount = decryptedIncrement[0].increment_unique_session;
        }

        // Step 2: Call get_total_visitor_count (no params)
        const payloadVisitor = {
            action: "function_call",
            function_name: "get_total_visitor_count",
            params: null
        };

        const responseVisitor = await $.ajax({
            url: `${BASE_API_URL}/commonfunction`,
            method: "POST",
            headers: {
                "X-APP-Key": "tnreat",
                "X-APP-Name": "tnreat"
            },
            data: {
                data: encryptData(payloadVisitor)
            },
            dataType: "json",
        });

        const decryptedVisitor = decryptData(responseVisitor?.data || "");

        console.log("Visitor Response:", decryptedVisitor);

        let totalCount = null;
        if (Array.isArray(decryptedVisitor) && decryptedVisitor[0]?.get_total_visitor_count) {
            totalCount = decryptedVisitor[0].get_total_visitor_count;
        }

        // Show final count in UI
        const visitorElement = document.getElementById("visitorCount");
        if (visitorElement) {
            visitorElement.innerText =
                "Visitors count: " + (totalCount ?? latestCount ?? "N/A");
        }

    } catch (error) {
        console.error("Error fetching visitor count:", error);
    }

    // === Last Updated Date ===
    try {
        const payloadDate = {
            action: "function_call",
            function_name: "get_last_updated_date",
            params: null
        };

        const responseDate = await $.ajax({
            url: `${BASE_API_URL}/commonfunction`,
            method: "POST",
            headers: {
                "X-APP-Key": "tnreat",
                "X-APP-Name": "tnreat"
            },
            data: {
                data: encryptData(payloadDate)
            },
            dataType: "json",
        });

        const decryptedDate = decryptData(responseDate?.data || "");

        console.log("Last Updated Response:", decryptedDate);

        if (Array.isArray(decryptedDate) && decryptedDate[0]?.get_last_updated_date) {
            const lastUpdated = document.getElementById("lastUpdated");

            if (lastUpdated) {
                const dateObj = new Date(decryptedDate[0].get_last_updated_date);

                const day = String(dateObj.getDate()).padStart(2, "0");
                const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                const year = dateObj.getFullYear();

                const formattedDate = `${day}-${month}-${year}`;

                lastUpdated.innerText = "Last updated on: " + formattedDate;
            }
        }
    } catch (error) {
        console.error("Error fetching last updated date:", error);
    }
});
