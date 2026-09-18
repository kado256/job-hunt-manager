const companyList = document.getElementById("company-list");
const searchInput = document.getElementById("search-input");
const filterIndustry = document.getElementById("filter-industry");
const filterStatus = document.getElementById("filter-status");
const sortOrder = document.getElementById("sort-order");

function getCompanies() {
    return JSON.parse(localStorage.getItem("companies")) || [];
}

function getDeadlineStatus(deadlineStr) {
    if (!deadlineStr) {
        return { text: "未設定", status: "none", days: null };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = deadlineStr.split("-").map(Number);
    const deadlineDate = new Date(parts[0], parts[1] - 1, parts[2]);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            text: deadlineStr + " (締切終了)",
            status: "expired",
            days: diffDays,
            badge: "締切終了"
        };
    } else if (diffDays === 0) {
        return {
            text: deadlineStr + " (本日締切！)",
            status: "urgent",
            days: 0,
            badge: "本日締切！"
        };
    } else if (diffDays <= 3) {
        return {
            text: deadlineStr + " (あと" + diffDays + "日！)",
            status: "urgent",
            days: diffDays,
            badge: "あと" + diffDays + "日"
        };
    } else {
        return {
            text: deadlineStr + " (あと" + diffDays + "日)",
            status: "normal",
            days: diffDays,
            badge: "あと" + diffDays + "日"
        };
    }
}

function sortCompanies(list, order) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...list].sort(function (a, b) {
        if (order === "deadline-asc") {
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;

            const aDate = new Date(a.deadline + "T00:00:00");
            const bDate = new Date(b.deadline + "T00:00:00");
            const aDiff = Math.round((aDate - today) / (1000 * 60 * 60 * 24));
            const bDiff = Math.round((bDate - today) / (1000 * 60 * 60 * 24));

            if (aDiff >= 0 && bDiff >= 0) return aDiff - bDiff;
            if (aDiff >= 0 && bDiff < 0) return -1;
            if (aDiff < 0 && bDiff >= 0) return 1;
            return bDate - aDate;
        } else if (order === "priority-desc") {
            return (b.priority || 0) - (a.priority || 0);
        } else if (order === "created-asc") {
            return (a.id || 0) - (b.id || 0);
        } else {
            return (b.id || 0) - (a.id || 0);
        }
    });
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
    const selectedOrder = sortOrder ? sortOrder.value : "deadline-asc";

    let filteredCompanies = companies.filter(function (company) {
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

    filteredCompanies = sortCompanies(filteredCompanies, selectedOrder);

    filteredCompanies.forEach(function (company) {
        const article = document.createElement("article");
        const deadlineInfo = getDeadlineStatus(company.deadline);
        article.classList.add("company-card");
        if (deadlineInfo.status !== "none") {
            article.classList.add("deadline-" + deadlineInfo.status);
        }

        const name = document.createElement("h3");
        name.className = "card-title";
        name.textContent = company.name;

        const industry = document.createElement("p");
        industry.className = "card-meta card-industry";
        industry.textContent =
            "業界：" + (company.industry || "未設定");

        const deadline = document.createElement("p");
        deadline.className = "card-meta deadline-text " + (deadlineInfo.status === "urgent" ? "urgent" : "") + (deadlineInfo.status === "expired" ? "expired" : "");
        deadline.textContent =
            "ES締切：" + deadlineInfo.text;

        const status = document.createElement("p");
        status.className = "card-meta card-status";
        status.textContent =
            "選考状況：" + company.status;

        const priority = document.createElement("p");
        priority.className = "card-meta card-priority";
        priority.textContent =
            "志望度：" + "★".repeat(company.priority);

        article.appendChild(name);
        article.appendChild(industry);
        article.appendChild(deadline);
        article.appendChild(status);
        article.appendChild(priority);

        if (company.memo) {
            const memo = document.createElement("p");
            memo.className = "card-memo";
            memo.textContent = "メモ：" + company.memo;
            article.appendChild(memo);
        }

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "card-actions";

        if (company.myPageUrl) {
            const myPageLink = document.createElement("a");

            myPageLink.href = company.myPageUrl;
            myPageLink.textContent = "マイページ";
            myPageLink.className = "btn btn-sm btn-outline";
            myPageLink.target = "_blank";
            myPageLink.rel = "noopener noreferrer";

            actionsDiv.appendChild(myPageLink);
        }

        const editButton = document.createElement("a");
        editButton.href = "company-form.html?id=" + company.id;
        editButton.textContent = "編集";
        editButton.className = "btn btn-sm btn-edit";
        actionsDiv.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "削除";
        deleteButton.className = "btn btn-sm btn-delete";
        deleteButton.type = "button";

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

        actionsDiv.appendChild(deleteButton);
        article.appendChild(actionsDiv);

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
if (sortOrder) {
    sortOrder.addEventListener("change", renderCompanies);
}

renderCompanies();