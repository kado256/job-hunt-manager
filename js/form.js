const form = document.getElementById("company-form");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");

const params = new URLSearchParams(window.location.search);
const editId = params.get("id");

const companies = JSON.parse(localStorage.getItem("companies")) || [];
let targetCompany = null;

if (editId) {
  targetCompany = companies.find(function (item) {
    return String(item.id) === String(editId);
  });

  if (targetCompany) {
    document.title = "企業編集 | 就活管理アプリ";
    if (formTitle) formTitle.textContent = "企業情報を編集";
    if (submitBtn) submitBtn.textContent = "更新";

    document.getElementById("company-name").value = targetCompany.name || "";
    document.getElementById("industry").value = targetCompany.industry || "";
    document.getElementById("deadline").value = targetCompany.deadline || "";
    document.getElementById("status").value = targetCompany.status || "未エントリー";
    document.getElementById("priority").value = targetCompany.priority || 1;
    document.getElementById("mypage-url").value = targetCompany.myPageUrl || "";
    document.getElementById("memo").value = targetCompany.memo || "";
  } else {
    alert("指定された企業が見つかりませんでした。");
    window.location.href = "index.html";
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const companyData = {
    name: document.getElementById("company-name").value.trim(),
    industry: document.getElementById("industry").value,
    deadline: document.getElementById("deadline").value,
    status: document.getElementById("status").value,
    priority: Number(document.getElementById("priority").value),
    myPageUrl: document.getElementById("mypage-url").value.trim(),
    memo: document.getElementById("memo").value.trim()
  };

  const storedCompanies = JSON.parse(localStorage.getItem("companies")) || [];

  if (editId && targetCompany) {
    const updatedCompanies = storedCompanies.map(function (item) {
      if (String(item.id) === String(editId)) {
        return {
          ...item,
          ...companyData
        };
      }
      return item;
    });
    localStorage.setItem("companies", JSON.stringify(updatedCompanies));
  } else {
    const newCompany = {
      id: Date.now(),
      ...companyData
    };
    storedCompanies.push(newCompany);
    localStorage.setItem("companies", JSON.stringify(storedCompanies));
  }

  window.location.href = "index.html";
});