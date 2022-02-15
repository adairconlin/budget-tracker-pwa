// define indexedDB
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

// variable to hold db connection
let db;
// establish a connection to IndexedDB database called "budget_tracker" and set it to version 1
const request = indexedDB.open("budget_tracker", 1)

// event with emit if databse version changes
request.onupgradeneeded = function(event) {
    // reference to database
    const db = event.target.result;
    // create an object store (table) called "new_budget" with auto increment primary key
    db.createObjectStore("new_budget", { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
    // check if app is online
    if(navigator.onLine) {
        uploadBudget();
    }
};

// log error if error
request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// will be executed if a submission attempt is made offline
function saveRecord(record) {
    // open new transaction with read and write permission
    const transaction = db.transaction(["new_budget"], "readwrite");
    // add record to the object store
    const budgetObjectStore = transaction.objectStore("new_budget");
    budgetObjectStore.add(record);
};

function uploadBudget() {
    // open transaction and access object store
    const transaction = db.transaction(["new_budget"], "readwrite");
    const budgetObjectStore = transaction.objectStore("new_budget");
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type" : "application/json"
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction and access the new_budget object store
                const transaction = db.transaction(["new_budget"], "readwrite");
                const budgetObjectStore = transaction.objectStore("new_budget");
                budgetObjectStore.clear();
                alert("All budget transactions have been submitted!");
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

window.addEventListener("online", uploadBudget);