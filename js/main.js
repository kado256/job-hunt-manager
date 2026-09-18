const companyList = document.getElementById("company-list");

const companies =
  JSON.parse(localStorage.getItem("companies")) || [];

if (companies.length === 0) {
  const message = document.createElement("p");
  message.textContent = "登録された企業はありません。";

  companyList.appendChild(message);
} else {
  companies.forEach(function (company) {
    const article = document.createElement("article");

    const name = document.createElement("h3");
    name.textContent = company.name;

    const industry = document.createElement("p");
    industry.textContent =
      "業界：" + (company.industry || "未設定");

    const deadline = document.createElement("p");
    deadline.textContent =
      "ES締切：" + (company.deadline || "未設定");

    const status = document.createElement("p");
    status.textContent =
      "選考状況：" + company.status;

    const priority = document.createElement("p");
    priority.textContent =
      "志望度：" + "★".repeat(company.priority);

    article.appendChild(name);
    article.appendChild(industry);
    article.appendChild(deadline);
    article.appendChild(status);
    article.appendChild(priority);

    if (company.myPageUrl) {
      const myPageLink = document.createElement("a");

      myPageLink.href = company.myPageUrl;
      myPageLink.textContent = "マイページ";
      myPageLink.target = "_blank";
      myPageLink.rel = "noopener noreferrer";

      article.appendChild(myPageLink);
    }

    companyList.appendChild(article);
  });
}