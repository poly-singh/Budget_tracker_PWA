let db;

const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;
  
// Create a new db request for a "budget" database.
const request = indexedDB.open('BudgetDB', 1);

request.onupgradeneeded = function (e) {
    let db = e.target.result
    db.createObjectStore('pending', { autoIncrement: true });
  }


request.onerror = function (e) {
  console.log(`error! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log('check db invoked');

  
  let transaction = db.transaction(['pending'], 'readwrite');

  // access 
  const store = transaction.objectStore('pending');

  
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // 
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
         
          if (res.length !== 0) {
            
            transaction = db.transaction(['pending'], 'readwrite');

           
            const currentStore = transaction.objectStore('pending');

            // Clear existing entries because our bulk add was successful
            currentStore.clear();
            console.log('Clearing store');
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    console.log('Backend online!');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('Save record invoked');
  // Create a transaction 
  const transaction = db.transaction(['pending'], 'readwrite');

  // Access your BudgetStore object store
  const store = transaction.objectStore('pending');

  // Add record to your store with add method.
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);