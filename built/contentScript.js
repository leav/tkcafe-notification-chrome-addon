var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const STORAGE_ITEM_NAME = 'notifications.eventDates';
const CACHE_DURATION_MS = 1 * 1000;
const NOTIFICATION_RANGE_MS = {
    MIN: -24 * 3600 * 1000,
    MAX: 72 * 3600 * 1000
};
function main() {
    const storageJson = localStorage.getItem(STORAGE_ITEM_NAME);
    if (storageJson) {
        const storage = JSON.parse(storageJson);
        console.log(`found cache at ${new Date(storage.lastUpdated)}`);
        showNotifications(storage.items);
        if (Date.now() - storage.lastUpdated > CACHE_DURATION_MS) {
            console.log(`cache expired, fetching update...`);
            return fetchNotificationItems().then(items => {
                saveNotificationItems(items);
                showNotifications(items);
            });
        }
        else {
            return;
        }
    }
    else {
        console.log(`cache not found, fetching update...`);
        return fetchNotificationItems().then(items => {
            saveNotificationItems(items);
            showNotifications(items);
        });
    }
}
function fetchNotificationItems() {
    return __awaiter(this, void 0, void 0, function* () {
        const favs = yield fetchFavorites();
        return Promise.all(favs.map(id => fetchNotificationItem(id)));
    });
}
function fetchNotificationItem(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(`https://tkcafe.net/wp-json/wp/v2/zitem/${id}`);
        if (res.ok) {
            const itemJson = yield res.json();
            return {
                eventDates: itemJson.dates ? itemJson.dates.map(date => ({
                    date: Date.parse(date.time),
                    note: date.thing,
                })) : [],
                id,
                name: itemJson.name,
                url: itemJson.link,
            };
        }
        else {
            throw new Error(`failed to fetch item ${id}`);
        }
    });
}
function saveNotificationItems(items) {
    const notificationStorage = {
        items,
        lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_ITEM_NAME, JSON.stringify(notificationStorage));
}
function fetchFavorites() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch('https://tkcafe.net/%e6%88%91%e7%9a%84%e7%a7%8d%e8%8d%89');
        if (!response.ok) {
            throw new Error('unable to fetch favorites');
        }
        return $(yield response.text()).find('article.zitem').map((index, item) => {
            const match = item.className.match(/\bpost-(\d+)\b/);
            if (match) {
                return match[1];
            }
            return '';
        }).get().filter(id => id.length > 0);
    });
}
function showNotifications(items) {
    items.forEach(item => {
        item.eventDates.forEach(eventDate => {
            const eventTime = eventDate.date - Date.now();
            if (eventTime >= NOTIFICATION_RANGE_MS.MIN && eventTime <= NOTIFICATION_RANGE_MS.MAX) {
                console.log(`通知：${item.name} - ${new Date(eventDate.date)} - ${eventDate.note}`);
                console.log(item.url);
            }
        });
    });
}
main();
