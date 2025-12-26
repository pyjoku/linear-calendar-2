/**
 * CalendarView - Linear Calendar View for Obsidian
 *
 * Displays all 365 days of the year in a linear table format:
 * - 12 rows (one per month)
 * - ~37 columns (days aligned by weekday)
 * - Notes displayed as clickable links in cells
 */

import { ItemView, WorkspaceLeaf, Menu, TFile } from 'obsidian';
import type { CalendarService } from '../../application/services/CalendarService';
import type { CalendarEntry } from '../../core/domain/models/CalendarEntry';
import type { LocalDate } from '../../core/domain/models/LocalDate';
import { getToday, localDateToKey, createLocalDate, getWeekday, getDaysInMonth } from '../../core/domain/models/LocalDate';

export const VIEW_TYPE_LINEAR_CALENDAR = 'linear-calendar-2';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_DAY_CELLS = 37; // Max columns for days (6 padding + 31 days)

export interface CalendarViewConfig {
  service: CalendarService;
  openFile: (path: string) => Promise<void>;
}

export class CalendarView extends ItemView {
  private config: CalendarViewConfig | null = null;
  private containerEl_: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_LINEAR_CALENDAR;
  }

  getDisplayText(): string {
    return 'Linear Calendar';
  }

  getIcon(): string {
    return 'calendar';
  }

  initialize(config: CalendarViewConfig): void {
    this.config = config;
    this.config.service.setEventListeners({
      onEntriesUpdated: () => this.render(),
      onYearChanged: () => this.render(),
    });
  }

  async onOpen(): Promise<void> {
    this.containerEl_ = this.contentEl;
    this.containerEl_.addClass('linear-calendar-2');
    this.render();
  }

  async onClose(): Promise<void> {
    this.containerEl_?.empty();
    this.containerEl_ = null;
  }

  render(): void {
    if (!this.containerEl_ || !this.config) return;

    this.containerEl_.empty();

    const service = this.config.service;
    const year = service.getCurrentYear();

    // Create container
    const container = this.containerEl_.createDiv({ cls: 'lc2-container' });

    // Header with navigation
    this.renderHeader(container, year);

    // Calendar wrapper (scrollable)
    const wrapper = container.createDiv({ cls: 'lc2-wrapper' });

    // Calendar table
    this.renderCalendarTable(wrapper, year);
  }

  private renderHeader(container: HTMLElement, year: number): void {
    if (!this.config) return;

    const header = container.createDiv({ cls: 'lc2-header' });

    // Previous year button
    const prevBtn = header.createEl('button', {
      text: '←',
      cls: 'lc2-nav-btn',
      attr: { 'aria-label': 'Previous year' },
    });
    prevBtn.addEventListener('click', () => {
      this.config?.service.previousYear();
    });

    // Year display
    header.createEl('span', {
      text: String(year),
      cls: 'lc2-year-title',
    });

    // Next year button
    const nextBtn = header.createEl('button', {
      text: '→',
      cls: 'lc2-nav-btn',
      attr: { 'aria-label': 'Next year' },
    });
    nextBtn.addEventListener('click', () => {
      this.config?.service.nextYear();
    });

    // Today button
    const todayBtn = header.createEl('button', {
      text: 'Today',
      cls: 'lc2-nav-btn lc2-today-btn',
      attr: { 'aria-label': 'Go to today' },
    });
    todayBtn.addEventListener('click', () => {
      this.config?.service.goToToday();
    });
  }

  private renderCalendarTable(wrapper: HTMLElement, year: number): void {
    if (!this.config) return;

    const table = wrapper.createEl('table', { cls: 'lc2-calendar' });

    // Header row with weekday labels
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');

    // Empty cell for month label column
    headerRow.createEl('th', { cls: 'lc2-month-label-cell' });

    // Weekday headers (repeated across 37 columns)
    for (let i = 0; i < MAX_DAY_CELLS; i++) {
      headerRow.createEl('th', {
        text: WEEKDAYS[i % 7],
        cls: 'lc2-weekday-header',
      });
    }

    // Optional: right month label column
    headerRow.createEl('th', { cls: 'lc2-month-label-cell' });

    // Body with month rows
    const tbody = table.createEl('tbody');

    for (let month = 1; month <= 12; month++) {
      this.renderMonthRow(tbody, year, month);
    }

    // Footer row with weekday labels
    const tfoot = table.createEl('tfoot');
    const footerRow = tfoot.createEl('tr');
    footerRow.createEl('td', { cls: 'lc2-month-label-cell' });
    for (let i = 0; i < MAX_DAY_CELLS; i++) {
      footerRow.createEl('td', {
        text: WEEKDAYS[i % 7],
        cls: 'lc2-weekday-header',
      });
    }
    footerRow.createEl('td', { cls: 'lc2-month-label-cell' });
  }

  private renderMonthRow(tbody: HTMLElement, year: number, month: number): void {
    if (!this.config) return;

    const row = tbody.createEl('tr', { cls: 'lc2-month-row' });

    // Month label (left)
    row.createEl('td', {
      text: MONTH_NAMES[month - 1],
      cls: 'lc2-month-label',
    });

    // Calculate first day of week and days in month
    const firstDayOfMonth = createLocalDate(year, month, 1);
    const startingDayOfWeek = getWeekday(firstDayOfMonth); // 0=Sunday
    const daysInMonth = getDaysInMonth(year, month);

    // Get today for highlighting
    const today = getToday();
    const isCurrentMonth = today.year === year && today.month === month;

    // Empty padding cells
    for (let i = 0; i < startingDayOfWeek; i++) {
      row.createEl('td', { cls: 'lc2-day-cell lc2-day-cell--empty' });
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = createLocalDate(year, month, day);
      const isToday = isCurrentMonth && today.day === day;

      this.renderDayCell(row, date, isToday);
    }

    // Fill remaining cells to reach MAX_DAY_CELLS
    const totalCells = startingDayOfWeek + daysInMonth;
    for (let i = totalCells; i < MAX_DAY_CELLS; i++) {
      row.createEl('td', { cls: 'lc2-day-cell lc2-day-cell--empty' });
    }

    // Month label (right)
    row.createEl('td', {
      text: MONTH_NAMES[month - 1],
      cls: 'lc2-month-label',
    });
  }

  private renderDayCell(row: HTMLElement, date: LocalDate, isToday: boolean): void {
    if (!this.config) return;

    const cellClasses = ['lc2-day-cell'];
    if (isToday) {
      cellClasses.push('lc2-day-cell--today');
    }

    const cell = row.createEl('td', { cls: cellClasses.join(' ') });

    // Day number as clickable link
    const dayNumber = cell.createEl('a', {
      text: String(date.day).padStart(2, '0'),
      cls: 'lc2-day-number',
      href: '#',
    });

    dayNumber.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.config?.service.openDailyNote(date);
    });

    // Get entries for this date
    const entries = this.config.service.getEntriesForDate(date);

    if (entries.length > 0) {
      const notesContainer = cell.createDiv({ cls: 'lc2-day-notes' });

      // Show each entry as a link
      for (const entry of entries) {
        this.renderNoteLink(notesContainer, entry);
      }
    }
  }

  private renderNoteLink(container: HTMLElement, entry: CalendarEntry): void {
    if (!this.config) return;

    const noteLink = container.createEl('a', {
      text: entry.displayName,
      cls: 'lc2-note-link internal-link',
      href: '#',
    });

    noteLink.setAttribute('data-href', entry.filePath);

    // Click to open file
    noteLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.config?.openFile(entry.filePath);
    });

    // Right-click context menu
    noteLink.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showNoteContextMenu(e, entry);
    });

    // Hover preview (Obsidian style)
    noteLink.addEventListener('mouseover', (event) => {
      this.app.workspace.trigger('hover-link', {
        event,
        source: VIEW_TYPE_LINEAR_CALENDAR,
        hoverParent: this,
        targetEl: noteLink,
        linktext: entry.filePath,
      });
    });
  }

  private showNoteContextMenu(event: MouseEvent, entry: CalendarEntry): void {
    if (!this.config) return;

    const menu = new Menu();

    menu.addItem((item) => {
      item
        .setTitle('Open note')
        .setIcon('file')
        .onClick(() => {
          this.config?.openFile(entry.filePath);
        });
    });

    menu.addItem((item) => {
      item
        .setTitle('Open in new tab')
        .setIcon('file-plus')
        .onClick(() => {
          this.app.workspace.getLeaf('tab').openFile(
            this.app.vault.getAbstractFileByPath(entry.filePath) as TFile
          );
        });
    });

    menu.showAtMouseEvent(event);
  }
}
