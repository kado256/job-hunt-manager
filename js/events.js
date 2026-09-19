/**
 * events.js - 複数予定（イベント）のデータ管理モジュール
 */

/**
 * すべての予定をlocalStorageから取得
 * @returns {Array<Object>}
 */
function getEvents() {
  return JSON.parse(localStorage.getItem("events")) || [];
}

/**
 * 特定の企業に紐づく予定を開始日時順で取得
 * @param {number|string} companyId
 * @returns {Array<Object>}
 */
function getEventsByCompanyId(companyId) {
  const events = getEvents();
  return events
    .filter(function (event) {
      return String(event.companyId) === String(companyId);
    })
    .sort(function (a, b) {
      return (a.start || "").localeCompare(b.start || "");
    });
}

/**
 * 指定したIDの予定を取得
 * @param {number|string} eventId
 * @returns {Object|null}
 */
function getEventById(eventId) {
  const events = getEvents();
  return (
    events.find(function (event) {
      return String(event.id) === String(eventId);
    }) || null
  );
}

/**
 * 予定を新規作成または更新してlocalStorageに保存
 * @param {Object} eventData
 * @returns {Object} 保存された予定オブジェクト
 */
function saveEvent(eventData) {
  const events = getEvents();
  const isEdit = Boolean(eventData.id);

  const eventRecord = {
    id: isEdit ? Number(eventData.id) : Date.now(),
    companyId: Number(eventData.companyId),
    type: eventData.type || "その他",
    title: (eventData.title || "").trim(),
    start: eventData.start || "",
    end: eventData.end || "",
    allDay: Boolean(eventData.allDay),
    location: (eventData.location || "").trim(),
    memo: (eventData.memo || "").trim(),
    googleEventId: eventData.googleEventId || null
  };

  let updatedEvents;
  if (isEdit) {
    updatedEvents = events.map(function (item) {
      if (String(item.id) === String(eventRecord.id)) {
        return eventRecord;
      }
      return item;
    });
  } else {
    updatedEvents = [...events, eventRecord];
  }

  localStorage.setItem("events", JSON.stringify(updatedEvents));
  return eventRecord;
}

/**
 * 指定したIDの予定を削除
 * @param {number|string} eventId
 */
function deleteEvent(eventId) {
  const events = getEvents();
  const updatedEvents = events.filter(function (item) {
    return String(item.id) !== String(eventId);
  });
  localStorage.setItem("events", JSON.stringify(updatedEvents));
}

/**
 * 指定した企業の予定を一括削除 (企業削除時のカスケード用)
 * @param {number|string} companyId
 */
function deleteEventsByCompanyId(companyId) {
  const events = getEvents();
  const updatedEvents = events.filter(function (item) {
    return String(item.companyId) !== String(companyId);
  });
  localStorage.setItem("events", JSON.stringify(updatedEvents));
}

/**
 * 予定の日時を表示用にフォーマット
 * @param {Object} event
 * @returns {string}
 */
function formatEventDateTime(event) {
  if (!event || !event.start) return "日時未設定";

  if (event.allDay) {
    const startDate = event.start.split("T")[0];
    return startDate + " (終日)";
  }

  const startFormatted = event.start.replace("T", " ");
  if (event.end) {
    const endPart = event.end.includes("T")
      ? event.end.split("T")[1]
      : event.end;
    return startFormatted + " 〜 " + endPart;
  }
  return startFormatted;
}

/**
 * 直近の予定（現在以降で最も近いもの）を取得
 * @param {number|string} companyId
 * @returns {Object|null}
 */
function getUpcomingEvent(companyId) {
  const companyEvents = getEventsByCompanyId(companyId);
  if (companyEvents.length === 0) return null;

  const nowIso = new Date().toISOString();
  // 今日以降の予定を優先
  const futureEvents = companyEvents.filter(function (event) {
    const eventTime = event.allDay
      ? event.start.split("T")[0] + "T23:59:59"
      : event.start;
    return eventTime >= nowIso.slice(0, 10);
  });

  if (futureEvents.length > 0) {
    return futureEvents[0];
  }
  // 未来の予定がなければ直近の最新予定
  return companyEvents[companyEvents.length - 1];
}
