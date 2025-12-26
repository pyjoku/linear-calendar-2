/**
 * CalendarView - Main Obsidian view for the linear calendar
 *
 * This view renders the calendar grid and handles user interactions.
 */

import { ItemView, WorkspaceLeaf, Menu, TFile } from 'obsidian';
import type { CalendarService } from '../../application/services/CalendarService';
import type { CalendarGrid, MonthData, DayData } from '../../core/engines/CalendarEngine';
import type { CalendarEntry } from '../../core/domain/models/CalendarEntry';
import { localDateToKey } from '../../core/domain/models/LocalDate';
import { CSS_CLASSES, MONTH_NAMES, ARIA_LABELS } from '../../core/utils/constants';

export const VIEW_TYPE_LINEAR_CALENDAR = 'linear-calendar-2';

/**
 * Configuration passed to the view
 */
export interface CalendarViewConfig {
  service: CalendarService;
  openFile: (path: string) => Promise<void>;
}

/**
 * Main calendar view that displays the linear calendar
 */
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

  /**
   * Initializes the view with configuration
   */
  initialize(config: CalendarViewConfig): void {
    this.config = config;
    this.config.service.setEventListeners({
      onEntriesUpdated: () => this.render(),
      onYearChanged: () => this.render(),
    });
  }

  async onOpen(): Promise<void> {
    this.containerEl_ = this.contentEl.createDiv({
      cls: CSS_CLASSES.container,
    });
    this.render();
  }

  async onClose(): Promise<void> {
    this.containerEl_?.empty();
    this.containerEl_ = null;
  }

  /**
   * Renders the calendar view
   */
  render(): void {
    if (!this.containerEl_ || !this.config) return;

    this.containerEl_.empty();

    const service = this.config.service;
    const year = service.getCurrentYear();
    const grid = service.generateCalendarGrid();

    // Render header
    this.renderHeader(year);

    // Render calendar grid
    this.renderCalendarGrid(grid);
  }

  /**
   * Renders the header with navigation
   */
  private renderHeader(year: number): void {
    if (!this.containerEl_ || !this.config) return;

    const header = this.containerEl_.createDiv({
      cls: CSS_CLASSES.header,
    });

    // Navigation buttons
    const nav = header.createDiv({ cls: CSS_CLASSES.navigation });

    const prevBtn = nav.createEl('button', {
      text: '<',
      cls: CSS_CLASSES.navButton,
      attr: { 'aria-label': 'Previous year' },
    });
    prevBtn.addEventListener('click', () => {
      this.config?.service.previousYear();
    });

    const yearDisplay = nav.createEl('span', {
      text: String(year),
      cls: CSS_CLASSES.yearDisplay,
    });

    const nextBtn = nav.createEl('button', {
      text: '>',
      cls: CSS_CLASSES.navButton,
      attr: { 'aria-label': 'Next year' },
    });
    nextBtn.addEventListener('click', () => {
      this.config?.service.nextYear();
    });

    // Today button
    const todayBtn = header.createEl('button', {
      text: 'Today',
      cls: CSS_CLASSES.todayButton,
      attr: { 'aria-label': 'Go to today' },
    });
    todayBtn.addEventListener('click', () => {
      this.config?.service.goToToday();
    });
  }

  /**
   * Renders the calendar grid
   */
  private renderCalendarGrid(grid: CalendarGrid): void {
    if (!this.containerEl_ || !this.config) return;

    const gridEl = this.containerEl_.createDiv({
      cls: CSS_CLASSES.grid,
    });

    for (const month of grid.months) {
      this.renderMonth(gridEl, month);
    }
  }

  /**
   * Renders a single month
   */
  private renderMonth(container: HTMLElement, month: MonthData): void {
    const monthEl = container.createDiv({
      cls: CSS_CLASSES.month,
    });

    // Month header
    const headerEl = monthEl.createDiv({
      cls: CSS_CLASSES.monthHeader,
    });
    headerEl.createEl('span', {
      text: month.name,
      cls: CSS_CLASSES.monthName,
    });

    // Days grid
    const daysEl = monthEl.createDiv({
      cls: CSS_CLASSES.days,
    });

    for (const day of month.days) {
      this.renderDay(daysEl, day);
    }
  }

  /**
   * Renders a single day cell
   */
  private renderDay(container: HTMLElement, day: DayData): void {
    if (!this.config) return;

    const dayEl = container.createDiv({
      cls: this.getDayClasses(day),
    });

    if (day.isEmpty) {
      // Empty padding cell
      return;
    }

    // Day number
    const dayNumber = dayEl.createEl('span', {
      text: String(day.date.day),
      cls: CSS_CLASSES.dayNumber,
    });

    // Get entries for this day
    const entries = this.config.service.getEntriesForDate(day.date);

    // Add entry indicators
    if (entries.length > 0) {
      dayEl.addClass(CSS_CLASSES.hasEntries);

      const indicatorContainer = dayEl.createDiv({
        cls: CSS_CLASSES.entryIndicators,
      });

      // Show up to 3 indicators
      const maxIndicators = 3;
      for (let i = 0; i < Math.min(entries.length, maxIndicators); i++) {
        indicatorContainer.createDiv({
          cls: CSS_CLASSES.entryIndicator,
        });
      }

      // Show +N if more than 3
      if (entries.length > maxIndicators) {
        indicatorContainer.createEl('span', {
          text: `+${entries.length - maxIndicators}`,
          cls: CSS_CLASSES.moreIndicator,
        });
      }
    }

    // Click handler to open daily note
    dayEl.addEventListener('click', (event) => {
      if (event.button === 0) {
        this.handleDayClick(day);
      }
    });

    // Right-click handler for context menu
    dayEl.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.showDayContextMenu(event, day, entries);
    });

    // Keyboard accessibility
    dayEl.setAttribute('tabindex', '0');
    dayEl.setAttribute('role', 'button');
    dayEl.setAttribute('aria-label', this.getDayAriaLabel(day, entries.length));
    dayEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleDayClick(day);
      }
    });
  }

  /**
   * Gets CSS classes for a day cell
   */
  private getDayClasses(day: DayData): string {
    const classes: string[] = [CSS_CLASSES.day];

    if (day.isEmpty) {
      classes.push(CSS_CLASSES.emptyDay);
    }

    if (day.isToday) {
      classes.push(CSS_CLASSES.today);
    }

    // Add weekend class
    if (!day.isEmpty) {
      const dayOfWeek = new Date(
        day.date.year,
        day.date.month - 1,
        day.date.day
      ).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        classes.push(CSS_CLASSES.weekend);
      }
    }

    return classes.join(' ');
  }

  /**
   * Gets the aria-label for a day cell
   */
  private getDayAriaLabel(day: DayData, entryCount: number): string {
    const dateStr = `${MONTH_NAMES[day.date.month - 1]} ${day.date.day}, ${day.date.year}`;

    if (day.isToday) {
      if (entryCount > 0) {
        return `Today, ${dateStr}, ${entryCount} note${entryCount === 1 ? '' : 's'}`;
      }
      return `Today, ${dateStr}`;
    }

    if (entryCount > 0) {
      return `${dateStr}, ${entryCount} note${entryCount === 1 ? '' : 's'}`;
    }

    return dateStr;
  }

  /**
   * Handles click on a day cell
   */
  private async handleDayClick(day: DayData): Promise<void> {
    if (!this.config) return;

    // Open or create daily note
    await this.config.service.openDailyNote(day.date);
  }

  /**
   * Shows the context menu for a day cell
   */
  private showDayContextMenu(
    event: MouseEvent,
    day: DayData,
    entries: readonly CalendarEntry[]
  ): void {
    if (!this.config) return;

    const menu = new Menu();

    // Option to create/open daily note
    menu.addItem((item) => {
      item
        .setTitle('Open Daily Note')
        .setIcon('file-text')
        .onClick(() => {
          this.config?.service.openDailyNote(day.date);
        });
    });

    // If there are entries, show them
    if (entries.length > 0) {
      menu.addSeparator();

      for (const entry of entries) {
        menu.addItem((item) => {
          const basename = entry.filePath.split('/').pop()?.replace('.md', '') ?? entry.filePath;
          item
            .setTitle(basename)
            .setIcon('file')
            .onClick(() => {
              this.config?.openFile(entry.filePath);
            });
        });
      }
    }

    menu.showAtMouseEvent(event);
  }
}
