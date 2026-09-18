const companyList = document.getElementById("company-list");
const searchInput = document.getElementById("search-input");
const filterIndustry = document.getElementById("filter-industry");
const filterStatus = document.getElementById("filter-status");

function getCompanies() {
    return JSON.parse(localStorage.getItem("companies")) || [];
}

function renderCompanies() {
    const companies = getCompanies();
    companyList.innerHTML = "";

    if (companies.length === 0) {
        const message = document.createElement("p");
        message.textContent = "登録された企業はありません。";
        companyList.appendChild(message);
        return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedIndustry = filterIndustry ? filterIndustry.value : "";
    const selectedStatus = filterStatus ? filterStatus.value : "";

    const filteredCompanies = companies.filter(function (company) {
        const matchesKeyword = !keyword || (company.name && company.name.toLowerCase().includes(keyword));
        const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry;
        const matchesStatus = !selectedStatus || company.status === selectedStatus;
        return matchesKeyword && matchesIndustry && matchesStatus;
    });

    if (filteredCompanies.length === 0) {
        const message = document.createElement("p");
        message.textContent = "条件に一致する企業は見つかりませんでした。";
        companyList.appendChild(message);
        return;
    }

    filteredCompanies.forEach(function (company) {
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

        const editButton = document.createElement("a");
        editButton.href = "company-form.html?id=" + company.id;
        editButton.textContent = "編集";
        article.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "削除";

        deleteButton.addEventListener("click", function () {
            const confirmed = confirm(
                company.name + " を削除しますか？"
            );

            if (!confirmed) {
                return;
            }

            const currentCompanies = getCompanies();
            const updatedCompanies = currentCompanies.filter(function (item) {
                return item.id !== company.id;
            });

            localStorage.setItem(
                "companies",
                JSON.stringify(updatedCompanies)
            );

            renderCompanies();
        });

        article.appendChild(deleteButton);

        companyList.appendChild(article);
    });
}

if (searchInput) {
    searchInput.addEventListener("input", renderCompanies);
}
if (filterIndustry) {
    filterIndustry.addEventListener("change", renderCompanies);
}
if (filterStatus) {
    filterStatus.addEventListener("change", renderCompanies);
}

renderCompanies();