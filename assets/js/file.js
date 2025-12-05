function checkFile(selector) {
    const fileInput = $(selector)[0];
    const files = fileInput.files;
    const validTypes = ['application/pdf', 'image/jpeg'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    const maxFiles = 5;

    let errors = false;
    let errorMsg = "";

    // Reset previous error message
    $('#' + selector.replace('#', '') + '_error_placeholder').text('');

    if (files.length > maxFiles) {
        errorMsg = `Maximum of ${maxFiles} files allowed.`;
        errors = true;
    }

    for (let file of files) {
        if (!validTypes.includes(file.type)) {
            errorMsg = `Invalid file type: ${file.name}. Only PDF and JPEG images are allowed.`;
            errors = true;
            break;
        }

        if (file.size > maxSize) {
            errorMsg = `File "${file.name}" exceeds the 2MB size limit.`;
            errors = true;
            break;
        }
    }

    if (errors) {
        $('#' + selector.replace('#', '') + '_error_placeholder')
            .text(errorMsg)
            .css('color', 'red');
        return false;
    }

    return true;
}

function processFile(selector) {
    return new Promise((resolve, reject) => {
        const fileInput = $(selector)[0];
        const files = fileInput.files;
        const processedFiles = [];

        if (files.length === 0) {
            resolve([]);
            return;
        }

        let fileReaders = [];

        for (let file of files) {
            const reader = new FileReader();
            const fileData = {};

            const readerPromise = new Promise((res, rej) => {
                reader.onload = function (event) {
                    fileData.fileBase64 = event.target.result.split(',')[1];
                    fileData.mimetype = file.type;
                    fileData.filename = file.name;
                    res(fileData);
                };

                reader.onerror = function (error) {
                    rej(error);
                };

                reader.readAsDataURL(file);
            });

            fileReaders.push(readerPromise);
        }

        Promise.all(fileReaders)
            .then(results => resolve(results))
            .catch(error => reject(error));
    });
}

function renderFileList(files) {
    const container = $('#uploadedFileList');
    container.empty();

    if (!files || files.length === 0) return;

    const list = $('<ul style="padding-left: 1rem;"></ul>');

    files.forEach((file, index) => {
        const item = $(`
      <li style="margin-bottom: 5px;">
        📄 <strong>${file.filename}</strong>
        <span style="color: gray; font-size: 0.85em;">(${(file.fileBase64.length * 0.75 / 1024).toFixed(1)} KB)</span>
      </li>
    `);
        list.append(item);
    });

    container.append(list);
}

window.processFile = processFile;
window.checkFile = checkFile;
window.renderFileList = renderFileList;