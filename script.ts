declare const rxjs: any;

const { BehaviorSubject, fromEvent, combineLatest } = rxjs;
const { map } = rxjs;

type Note = {
	id: number;
	text: string;
};

const notes$ = new BehaviorSubject([] as Note[]);
const page$ = new BehaviorSubject(1);

const NOTES_PER_PAGE = 5;

const input = document.getElementById("noteInput") as HTMLInputElement;
const addBtn = document.getElementById("addBtn") as HTMLButtonElement;
const list = document.getElementById("notesList") as HTMLDivElement;
const pagination = document.getElementById("pagination") as HTMLDivElement;

fromEvent(addBtn, "click")
	.pipe(
		map(() => input.value.trim())
	)
	.subscribe((text: string) => {
		if (!text) return;

		const current = notes$.getValue();

		const updated: Note[] = [
			...current,
			{ id: Date.now(), text }
		];

		notes$.next(updated);

		const newPage = Math.ceil(updated.length / NOTES_PER_PAGE);
		page$.next(newPage);

		input.value = "";
	});

fromEvent(list, "click")
	.pipe(
		map((e: Event) => (e.target as HTMLElement).closest("button")?.getAttribute("data-id"))
	)
	.subscribe((id: string | null) => {
		if (!id) return;

		const updated = notes$.getValue().filter((n: Note) => n.id != Number(id));
		notes$.next(updated);
	});

fromEvent(pagination, "click")
	.pipe(
		map((e: Event) => Number((e.target as HTMLElement).closest("button")?.getAttribute("data-page")))
	)
	.subscribe((page: number) => {
		if (!page || isNaN(page)) return;
		page$.next(page);
	});

combineLatest([notes$, page$]).subscribe(([notes, page]: [Note[], number]) => {
	const maxPage = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));

	if (page > maxPage) {
		page$.next(maxPage);
		return;
	}

	renderNotes(notes, page);
	renderPagination(notes.length, page);
});

function renderNotes(notes: Note[], page: number): void {
	const start = (page - 1) * NOTES_PER_PAGE;
	const current = notes.slice(start, start + NOTES_PER_PAGE);

	list.innerHTML = current.map(n => `
		<div class="note">
		  <span class="note_text">${n.text}</span>
		  <button class="button_style" data-id="${n.id}">Видалити</button>
		</div>
	`).join("");
}

function renderPagination(total: number, currentPage: number): void {
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


let saved: Note[] = [];

try {
	saved = JSON.parse(localStorage.getItem("notes") || "[]");
} catch {
	saved = [];
}

notes$.next(saved);

notes$.subscribe((notes: Note[]) => {
	localStorage.setItem("notes", JSON.stringify(notes));
});