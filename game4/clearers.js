(() => {
  const recordsEndpoint = "https://script.google.com/macros/s/AKfycbwZWUR7tHeXEwQKQG7EkdkfTnfrWnff-nOC1sTXO0MN6KGW2FcH0STtsVyx--iq-z-4/exec";
  const recordsFrame = document.getElementById("recordsFrame");
  const reloadRecords = document.getElementById("reloadRecords");
  const recordsStatus = document.getElementById("recordsStatus");

  function loadRecords() {
    reloadRecords.disabled = true;
    recordsStatus.textContent = "一覧を読み込んでいます…";
    const url = new URL(recordsEndpoint);
    url.searchParams.set("view", "records");
    url.searchParams.set("t", Date.now().toString());
    recordsFrame.src = url.toString();
  }

  recordsFrame.addEventListener("load", () => {
    reloadRecords.disabled = false;
    recordsStatus.textContent = "";
  });
  reloadRecords.addEventListener("click", loadRecords);
  loadRecords();
})();
