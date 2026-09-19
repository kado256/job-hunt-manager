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

        // 直近予定のサマリー表示 (Phase 1)
        const upcomingEvent = typeof getUpcomingEvent === "function" ? getUpcomingEvent(company.id) : null;
        if (upcomingEvent) {
            const upcomingP = document.createElement("p");
            upcomingP.className = "card-meta card-upcoming-event";

            const labelSpan = document.createElement("span");
            labelSpan.className = "upcoming-label";
            labelSpan.textContent = "直近予定：";

            const textSpan = document.createElement("span");
            textSpan.className = "upcoming-text";
            textSpan.textContent = "[" + upcomingEvent.type + "] " + upcomingEvent.title + " (" + formatEventDateTime(upcomingEvent) + ")";

            upcomingP.appendChild(labelSpan);
            upcomingP.appendChild(textSpan);
            article.appendChild(upcomingP);
        }

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "card-actions";

        // 予定管理ボタン群 (Phase 1)
        const companyEvents = typeof getEventsByCompanyId === "function" ? getEventsByCompanyId(company.id) : [];

        const viewEventsBtn = document.createElement("button");
        viewEventsBtn.type = "button";
        viewEventsBtn.className = "btn btn-sm btn-event-view";
        viewEventsBtn.textContent = "📅 予定 (" + companyEvents.length + ")";
        viewEventsBtn.addEventListener("click", function () {
            openEventListModal(company);
        });
        actionsDiv.appendChild(viewEventsBtn);

        const addEventBtn = document.createElement("button");
        addEventBtn.type = "button";
        addEventBtn.className = "btn btn-sm btn-event-add";
        addEventBtn.textContent = "＋ 予定追加";
        addEventBtn.addEventListener("click", function () {
            openEventFormModal(company);
        });
        actionsDiv.appendChild(addEventBtn);

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
                company.name + " を削除しますか？\n紐づく予定データもすべて削除されます。"
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

            // 紐づく予定もカスケード削除
            if (typeof deleteEventsByCompanyId === "function") {
                deleteEventsByCompanyId(company.id);
            }

            renderCompanies();
        });

        actionsDiv.appendChild(deleteButton);
        article.appendChild(actionsDiv);

        companyList.appendChild(article);
    });
}

/* ===================================================
   予定モーダル管理 (Phase 1)
   =================================================== */

const eventFormModal = document.getElementById("event-form-modal");
const eventListModal = document.getElementById("event-list-modal");
const eventForm = document.getElementById("event-form");
const eventAllDayCheckbox = document.getElementById("event-all-day");
const eventStartInput = document.getElementById("event-start");
const eventEndInput = document.getElementById("event-end");

let activeModalCompany = null;

// 終日チェックボックス切り替えハンドラ
if (eventAllDayCheckbox && eventStartInput && eventEndInput) {
    eventAllDayCheckbox.addEventListener("change", function () {
        const isAllDay = this.checked;
        const currentStart = eventStartInput.value;
        const currentEnd = eventEndInput.value;

        if (isAllDay) {
            eventStartInput.type = "date";
            eventEndInput.type = "date";
            if (currentStart) eventStartInput.value = currentStart.split("T")[0];
            if (currentEnd) eventEndInput.value = currentEnd.split("T")[0];
        } else {
            eventStartInput.type = "datetime-local";
            eventEndInput.type = "datetime-local";
            if (currentStart && !currentStart.includes("T")) {
                eventStartInput.value = currentStart + "T09:00";
            }
            if (currentEnd && !currentEnd.includes("T")) {
                eventEndInput.value = currentEnd + "T10:00";
            }
        }
    });
}

// 予定登録・編集モーダルを開く
function openEventFormModal(company, eventToEdit = null) {
    if (!eventFormModal || !company) return;
    activeModalCompany = company;

    document.getElementById("event-company-id").value = company.id;
    document.getElementById("event-company-name-display").textContent = company.name;

    const modalTitle = document.getElementById("event-modal-title");
    const idInput = document.getElementById("event-id");
    const typeSelect = document.getElementById("event-type");
    const titleInput = document.getElementById("event-title");
    const locationInput = document.getElementById("event-location");
    const memoTextarea = document.getElementById("event-memo");

    if (eventToEdit) {
        modalTitle.textContent = "予定を編集";
        idInput.value = eventToEdit.id;
        typeSelect.value = eventToEdit.type || "面接";
        titleInput.value = eventToEdit.title || "";
        locationInput.value = eventToEdit.location || "";
        memoTextarea.value = eventToEdit.memo || "";

        eventAllDayCheckbox.checked = Boolean(eventToEdit.allDay);
        if (eventToEdit.allDay) {
            eventStartInput.type = "date";
            eventEndInput.type = "date";
            eventStartInput.value = eventToEdit.start ? eventToEdit.start.split("T")[0] : "";
            eventEndInput.value = eventToEdit.end ? eventToEdit.end.split("T")[0] : "";
        } else {
            eventStartInput.type = "datetime-local";
            eventEndInput.type = "datetime-local";
            eventStartInput.value = eventToEdit.start || "";
            eventEndInput.value = eventToEdit.end || "";
        }
    } else {
        modalTitle.textContent = "予定を追加";
        idInput.value = "";
        typeSelect.value = "面接";
        titleInput.value = "";
        locationInput.value = "";
        memoTextarea.value = "";

        eventAllDayCheckbox.checked = false;
        eventStartInput.type = "datetime-local";
        eventEndInput.type = "datetime-local";

        // デフォルト値: 明日の10:00〜11:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const dd = String(tomorrow.getDate()).padStart(2, "0");
        eventStartInput.value = `${yyyy}-${mm}-${dd}T10:00`;
        eventEndInput.value = `${yyyy}-${mm}-${dd}T11:00`;
    }

    eventFormModal.showModal();
}

// 予定一覧モーダルを開く
function openEventListModal(company) {
    if (!eventListModal || !company) return;
    activeModalCompany = company;

    document.getElementById("event-list-company-name").textContent = company.name;
    renderModalEvents(company);

    const modalAddBtn = document.getElementById("modal-add-event-btn");
    if (modalAddBtn) {
        modalAddBtn.onclick = function () {
            openEventFormModal(company);
        };
    }

    eventListModal.showModal();
}

// 予定一覧モーダルの中身を描画
function renderModalEvents(company) {
    const container = document.getElementById("modal-events-container");
    if (!container) return;

    container.innerHTML = "";
    const events = typeof getEventsByCompanyId === "function" ? getEventsByCompanyId(company.id) : [];

    if (events.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.className = "modal-empty-message";
        emptyMsg.textContent = "登録されている予定はありません。";
        container.appendChild(emptyMsg);
        return;
    }

    events.forEach(function (event) {
        const item = document.createElement("div");
        item.className = "event-item";

        const headerDiv = document.createElement("div");
        headerDiv.className = "event-item-header";

        const typeBadge = document.createElement("span");
        typeBadge.className = "event-type-badge type-" + event.type;
        typeBadge.textContent = event.type;

        const titleSpan = document.createElement("h4");
        titleSpan.className = "event-item-title";
        titleSpan.textContent = event.title;

        headerDiv.appendChild(typeBadge);
        headerDiv.appendChild(titleSpan);

        const timeP = document.createElement("p");
        timeP.className = "event-item-meta";
        timeP.textContent = "🕒 " + formatEventDateTime(event);

        item.appendChild(headerDiv);
        item.appendChild(timeP);

        if (event.location) {
            const locP = document.createElement("p");
            locP.className = "event-item-meta";
            locP.textContent = "📍 " + event.location;
            item.appendChild(locP);
        }

        if (event.memo) {
            const memoP = document.createElement("p");
            memoP.className = "event-item-memo";
            memoP.textContent = event.memo;
            item.appendChild(memoP);
        }

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "event-item-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn btn-sm btn-edit";
        editBtn.textContent = "編集";
        editBtn.addEventListener("click", function () {
            openEventFormModal(company, event);
        });

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "btn btn-sm btn-delete";
        delBtn.textContent = "削除";
        delBtn.addEventListener("click", function () {
            const ok = confirm("予定「" + event.title + "」を削除しますか？");
            if (ok) {
                deleteEvent(event.id);
                renderModalEvents(company);
                renderCompanies();
            }
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);
        item.appendChild(actionsDiv);

        container.appendChild(item);
    });
}

// フォーム送信ハンドラ
if (eventForm) {
    eventForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const idVal = document.getElementById("event-id").value;
        const eventData = {
            id: idVal ? Number(idVal) : undefined,
            companyId: document.getElementById("event-company-id").value,
            type: document.getElementById("event-type").value,
            title: document.getElementById("event-title").value,
            allDay: eventAllDayCheckbox ? eventAllDayCheckbox.checked : false,
            start: eventStartInput.value,
            end: eventEndInput.value,
            location: document.getElementById("event-location").value,
            memo: document.getElementById("event-memo").value
        };

        if (typeof saveEvent === "function") {
            saveEvent(eventData);
        }

        if (eventFormModal) {
            eventFormModal.close();
        }

        if (eventListModal && eventListModal.open && activeModalCompany) {
            renderModalEvents(activeModalCompany);
        }

        renderCompanies();
    });
}

// モーダル閉じるボタンのイベント
const closeFormBtn = document.getElementById("close-event-form-btn");
const cancelFormBtn = document.getElementById("cancel-event-form-btn");
if (closeFormBtn && eventFormModal) {
    closeFormBtn.addEventListener("click", function () {
        eventFormModal.close();
    });
}
if (cancelFormBtn && eventFormModal) {
    cancelFormBtn.addEventListener("click", function () {
        eventFormModal.close();
    });
}

const closeListBtn = document.getElementById("close-event-list-btn");
if (closeListBtn && eventListModal) {
    closeListBtn.addEventListener("click", function () {
        eventListModal.close();
    });
}

// 背景クリックで閉じる
if (eventFormModal) {
    eventFormModal.addEventListener("click", function (e) {
        if (e.target === eventFormModal) {
            eventFormModal.close();
        }
    });
}
if (eventListModal) {
    eventListModal.addEventListener("click", function (e) {
        if (e.target === eventListModal) {
            eventListModal.close();
        }
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