
const environment = "localhost"; // Change to 'dev' or 'prod' as needed

const baseUrls = {
    dev: "https://bcc.tn.gov.in/tnbcc_api/v1",
    prod: "https://tngis.tnega.org",
    localhost: "http://192.168.5.247:2210"
};

const BASE_API_URL = baseUrls[environment];
