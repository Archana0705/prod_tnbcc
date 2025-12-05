// loadTableWithSelection.js
import { decryptData } from './encrypt_decrypt.js';

let currentTableData = [];

window.loadTableWithSelection = function ({
    tableId,
    apiUrl,
    httpMethod = 'POST',
    payload,
    rowBuilder,
    onTableInit = () => { },
    onSelectionChange = () => { }
}) {
    const tableSelector = `#${tableId}`;
    const tableBody = $(`${tableSelector} tbody`);
    const tableHead = $(`${tableSelector} thead`);
    currentTableData = [];

    tableBody.html('<tr><td colspan="10" class="text-center">Loading...</td></tr>');

    $.ajax({
        url: apiUrl,
        method: httpMethod.toUpperCase(),
        headers: {
            'X-APP-Key': "edm",
            'X-APP-Name': "edm"
        },
        data: { data: payload },
        dataType: 'json',
        cache: false,
        success(response) {
            const data = decryptData(response.data);
            currentTableData = data;
            tableBody.empty();

            if (data.length === 0) {
                tableBody.html('<tr><td colspan="10" class="text-center">No Data Found</td></tr>');
                return;
            }

            if ($.fn.DataTable?.isDataTable(tableSelector)) {
                $(tableSelector).DataTable().clear().destroy();
            }

            if (!tableHead.find("th:first input[type='checkbox']").length) {
                const firstTh = tableHead.find("th").first();
                firstTh.html(`<input type="checkbox" id="${tableId}_select_all">`);
            }

            const rows = data.map((item, index) => {
                const rowHtml = rowBuilder(item, index);
                return `<tr data-index="${index}">
                  <td><input type="checkbox" class="row-checkbox" data-index="${index}"></td>
                  ${rowHtml}
                </tr>`;
            }).join('');

            tableBody.html(rows);

            const dtRef = $(tableSelector).DataTable({
                paging: true,
                searching: true,
                ordering: true,
                responsive: true,
            });

            $(`#${tableId}_select_all`).on('change', function () {
                const isChecked = $(this).is(':checked');
                $(`${tableSelector} tbody .row-checkbox`).prop('checked', isChecked);
                onSelectionChange(getSelectedRows());
            });

            $(`${tableSelector} tbody`).on('change', '.row-checkbox', function () {
                const all = $(`${tableSelector} .row-checkbox`);
                const checked = all.filter(':checked');
                $(`#${tableId}_select_all`).prop('checked', all.length === checked.length);
                onSelectionChange(getSelectedRows());
            });

            onTableInit(dtRef);
        },
        error(xhr, status, error) {
            console.error("API Error:", error);
            tableBody.html('<tr><td colspan="10" class="text-center">No Data Found</td></tr>');
        }
    });
};

window.getSelectedRows = function () {
    const selected = [];
    $('.row-checkbox:checked').each(function () {
        const index = $(this).data('index');
        if (typeof index !== 'undefined') {
            selected.push(currentTableData[index]);
        }
    });
    return selected;
};
