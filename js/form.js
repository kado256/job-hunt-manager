const form = document.getElementById("company-form");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const company = {
    id: Date.now(),
    name: document.getElementById("company-name").value.trim(),
    industry: document.getElementById("industry").value,
    deadline: document.getElementById("deadline").value,
    status: document.getElementById("status").value,
    priority: Number(document.getElementById("priority").value),
    myPageUrl: document.getElementById("mypage-url").value.trim(),
    memo: document.getElementById("memo").value.trim()
  };

  const companies =
    JSON.parse(localStorage.getItem("companies")) || [];

  companies.push(company);

  localStorage.setItem(
    "companies",
    JSON.stringify(companies)
  );

  window.location.href = "index.html";
});