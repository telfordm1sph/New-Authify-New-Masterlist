import axios from "axios";

window.axios = axios;
window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

window.axios.defaults.xsrfCookieName = "authify_xsrf";
window.axios.defaults.xsrfHeaderName = "X-XSRF-TOKEN";
