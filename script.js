"use strict";
const { BehaviorSubject, fromEvent, combineLatest } = rxjs;
const { map } = rxjs;
const notes$ = new BehaviorSubject([]);
const page$ = new BehaviorSubject(1);
const NOTES_PER_PAGE = 5;
const input = document.getElementById("noteInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("notesList");
const pagination = document.getElementById("pagination");
fromEvent(addBtn, "click")
    .pipe(map(() => input.value.trim()))
    .subscribe((text) => {
    if (!text)
        return;
    const current = notes$.getValue();
    const updated = [
        ...current,
        { id: Date.now(), text }
    ];
    notes$.next(updated);
    const newPage = Math.ceil(updated.length / NOTES_PER_PAGE);
    page$.next(newPage);
    input.value = "";
});
fromEvent(list, "click")
    .pipe(map((e) => e.target.closest("button")?.getAttribute("data-id")))
    .subscribe((id) => {
    if (!id)
        return;
    const updated = notes$.getValue().filter((n) => n.id != Number(id));
    notes$.next(updated);
});
fromEvent(pagination, "click")
    .pipe(map((e) => Number(e.target.closest("button")?.getAttribute("data-page"))))
    .subscribe((page) => {
    if (!page || isNaN(page))
        return;
    page$.next(page);
});
combineLatest([notes$, page$]).subscribe(([notes, page]) => {
    const maxPage = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));
    if (page > maxPage) {
        page$.next(maxPage);
        return;
    }
    renderNotes(notes, page);
    renderPagination(notes.length, page);
});
function renderNotes(notes, page) {
    const start = (page - 1) * NOTES_PER_PAGE;
    const current = notes.slice(start, start + NOTES_PER_PAGE);
    list.innerHTML = current.map(n => `
		<div class="note">
		  <span class="note_text">${n.text}</span>
		  <button class="button_style" data-id="${n.id}">Видалити</button>
		</div>
	`).join("");
}
function renderPagination(total, currentPage) {
    const pages = Math.ceil(total / NOTES_PER_PAGE);
    let html = "";
    for (let i = 1; i <= pages && i <= 100; i++) {
        html += `<button data-page="${i}"
		   class="${i === currentPage ? "button_style" : ""}">
		   ${i}
		</button>`;
    }
    pagination.innerHTML = html;
}
let saved = [];
try {
    saved = JSON.parse(localStorage.getItem("notes") || "[]");
}
catch {
    saved = [];
}
notes$.next(saved);
notes$.subscribe((notes) => {
    localStorage.setItem("notes", JSON.stringify(notes));
});
