window.loadDataToTable = function ({
    tableId,
    apiUrl,
    httpMethod = 'POST',
    payload,
    rowBuilder,
    onTableInit = () => { }
}) {
    const tableSelector = `#${tableId}`;
    const tableBody = $(`${tableSelector} tbody`);
    const colCount = Math.max($(tableSelector + ' thead th').length, 1);

    // 1️⃣ Destroy existing table first
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector).DataTable().clear().destroy();
    }

    // 2️⃣ Show loading
    tableBody.html(`<tr><td colspan="${colCount}" class="text-center">Loading...</td></tr>`);

    $.ajax({
        url: apiUrl,
        method: httpMethod.toUpperCase(),
        headers: {
            "X-App-Key": "edm_grievance_portal",
            "X-App-Name": "edm_grievance_portal"
        },
        data: { data: payload },
        dataType: 'json',
        cache: false,
        success: function (response) {
            let decrypted = [];
            try {
                decrypted = decryptData(response.data);
                if (!Array.isArray(decrypted)) decrypted = [];
            } catch (err) {
                console.error("Decryption failed:", err);
            }

            // 3️⃣ Build rows
            let rows = decrypted.map(rowBuilder).join('').trim();

            if (!rows) {
                rows = `<tr><td colspan="${colCount}" class="text-center text-muted fw-bold">No Data Found</td></tr>`;
            }

            // 4️⃣ Set tbody HTML AFTER destroying DataTable
            tableBody.html(rows);

            // 5️⃣ Re-initialize DataTable
            const dt = $(tableSelector).DataTable({
                destroy: true,
                responsive: true,
                ordering: true,
                searching: true,
                pageLength: 10,
                lengthChange: true,
                language: { emptyTable: "No Data Found" }
            });

            onTableInit(dt);
        },
        error(xhr, status, error) {
            console.error("API Error:", error);
            tableBody.html(`<tr><td colspan="${colCount}" class="text-center">No Data Found</td></tr>`);
        }
    });
};
