
window.loadDataToTable = function ({
    tableId,
    apiUrl,
    httpMethod = 'POST',
    payload,
    rowBuilder,
    onTableInit = () => { } // callback to return DataTable instance
}) {
    const tableSelector = `#${tableId}`;
    const tableBody = $(`${tableSelector} tbody`);
    tableBody.html('<tr><td colspan="10" class="text-center">Loading...</td></tr>');

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
            let decrypted;

            try {
                decrypted = decryptData(response.data);
                console.log("Decrypted response:", decrypted);
            } catch (err) {
                console.error("Decryption failed:", err);
                decrypted = [];
            }

            // ensure data is always an array
            let data = Array.isArray(decrypted) ? decrypted : [];

            let rows = data.map(rowBuilder).join('').trim();

            // if no rows at all, show "No Data Found"
            if (!rows) {
                rows = `
    <tr>
      <td colspan="12" class="text-center text-muted fw-bold">
        No Data Found
      </td>
    </tr>`;
            }

            tableBody.html(rows);

            // re-init DataTable
            if ($.fn.DataTable.isDataTable(tableSelector)) {
                $(tableSelector).DataTable().destroy();
            }

            const dt = $(tableSelector).DataTable({
                destroy: true,
                responsive: true,
                ordering: true,
                searching: true,
                pageLength: 10,
                lengthChange: true,
                language: {
                    emptyTable: "No Data Found"
                }
            });

            onTableInit(dt);
        },
        error(xhr, status, error) {
            console.error("API Error:", error);
            tableBody.html('<tr><td colspan="10" class="text-center">No Data Found</td></tr>');
        }
    });
};
