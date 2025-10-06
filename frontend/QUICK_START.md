# 🚀 Quick Start Guide - Merge & Export Pages

## Start the Application

```bash
cd frontend
npm run dev
```

Navigate to: **http://localhost:5173**

---

## 📍 Page Routes

### 1. `/merge-validate` - Merge & Validate Page
Preview merged data with validation and AI agent review.

**What You'll See:**
- ⏱️ **700ms skeleton loading** on entry
- 📊 **Table with 200 rows** (from 2,000 total)
- 🔵🟣 **Lineage dots** on each cell (hover to see provenance)
- 🔍 **Search box** to filter rows
- 🏷️ **Validation chips**: Missing (3), Invalid Format (4), Invalid Code (2), Duplicates (3)
- 🤖 **"Review by AI Agent"** button
- 🔒 **Secure Mode** toggle (masks sensitive data)

**Interactive Features:**
1. **Hover lineage dots** → See dataset source, column, row index, transforms
2. **Click issue chips** → Filter table to affected rows
3. **Click "Review by AI Agent"** → 5-second progress animation → Success report
4. **After review completes** → "Continue to Export" button activates

---

### 2. `/export` - Export & Downloads Page
Download the merged dataset in CSV or Excel format.

**What You'll See:**
- ⏱️ **1 second loading screen** on entry
- 📋 **Run Summary Card**: Run ID, timestamp, row/column counts, verification status
- 💚 **"Verified by AI Agent" badge** (if you completed review on previous page)
- ⬇️ **Download buttons** for CSV and XLSX
- 📄 **Column list** preview (scrollable)

**Download Options:**
1. **CSV** → Full 2,000-row export, works everywhere
2. **XLSX** → Excel format (if `xlsx` library installed, otherwise CSV fallback)

---

## 🎯 Key Features Showcase

### Lineage Tracking
Every cell shows its data provenance:
- **Blue dot** = from `bankA`
- **Purple dot** = from `bankB`
- Tooltip shows: dataset, original column, row index, transforms applied

### Validation Issues
12 realistic issues across 4 categories:
- **Missing Required** (red): Required fields with null values
- **Invalid Format** (amber): Email/phone format issues
- **Invalid Code** (orange): Values not in allowed set
- **Duplicate Key** (purple): Duplicate account numbers/emails

### AI Agent Review
Simulated 5-second verification with:
- 6 progress steps cycling every ~800ms
- Real-time progress bar
- Success report with detailed findings
- Verification badge after completion

---

## 🖱️ Keyboard Navigation

All features are keyboard-accessible:

- **Tab** → Move between interactive elements
- **Enter/Space** → Activate buttons, toggle switches, open tooltips
- **ESC** → Close dialogs and tooltips
- **Arrow Keys** → Navigate within table (native browser behavior)

---

## 📁 Mock Data Details

### Dataset: `merged.mock.json`
- **2,000 rows** of realistic banking data
- **20 columns**: account info, customer details, balances, dates, status
- **1,000 from bankA**, 1,000 from bankB
- **Full lineage** on every cell with transform tracking

### Validation: `checks.results.json`
- **12 issues** distributed across categories
- Row indices: 0-7 (visible in first 200 rows)
- Each issue has: kind, column, row, message, optional suggestion

---

## 🎨 UI Highlights

### Design System
- **Colors**: Semantic (red=error, amber=warning, green=success)
- **Shadows**: Soft, layered depth
- **Borders**: Rounded (8px-12px)
- **Typography**: Clean hierarchy, readable sizes
- **Spacing**: Consistent 4/8/12/16px grid

### Responsive Breakpoints
- **Mobile**: Stacked layout, full-width cards
- **Tablet**: 2-column grid for some sections
- **Desktop**: 4-column grid, sidebar + main content

### Dark Mode
- Fully supported via Tailwind's `dark:` classes
- High contrast maintained
- Semantic colors adjusted for readability

---

## 🧪 Testing Checklist

### Merge & Validate Page

- [ ] Page loads with skeleton animation (~700ms)
- [ ] Table shows 200 rows with 20 columns
- [ ] Lineage dots appear on all cells
- [ ] Hover dot → tooltip shows lineage (dataset, column, transforms)
- [ ] Search box filters rows correctly
- [ ] Validation panel shows 12 total issues
- [ ] Click "Missing" chip → filters to 3 rows
- [ ] Click "Invalid Format" chip → filters to 4 rows
- [ ] Toggle "Secure Mode" → masks lineage data
- [ ] Click "Review by AI Agent" → modal opens
- [ ] Progress bar animates for 5 seconds
- [ ] Success screen appears with report
- [ ] Click "Continue" → modal closes, toast appears
- [ ] "Verified" badge appears in header
- [ ] "Continue to Export" button becomes enabled
- [ ] Click "Continue to Export" → navigates to `/export`

### Export Page

- [ ] Page loads with 1s loading screen
- [ ] Run summary shows correct stats (2,000 rows, 20 columns)
- [ ] "Verified by AI Agent" badge appears (green)
- [ ] Column list displays all 20 columns
- [ ] Click "Download CSV" → file downloads
- [ ] Open CSV → contains 2,001 lines (header + 2,000 rows)
- [ ] Click "Download Excel (XLSX)" → file downloads
- [ ] Tooltip explains SheetJS requirement (if not installed)

### Accessibility

- [ ] All buttons keyboard-focusable (Tab)
- [ ] Focus rings visible on all interactive elements
- [ ] Enter/Space activates buttons
- [ ] ESC closes dialogs
- [ ] Lineage tooltips open with keyboard (Enter on dot)
- [ ] Screen reader announces issue counts
- [ ] ARIA labels present on all interactive elements

---

## 🔧 Configuration

Edit `src/config/app.ts` to adjust:

```typescript
export const SAMPLE_ROW_CAP = 200;              // Table preview limit
export const AGENT_REVIEW_DELAY_MS = 5000;      // AI review duration (5s)
export const MERGE_PAGE_SKELETON_DELAY_MS = 700;   // Loading time
export const EXPORT_PAGE_SKELETON_DELAY_MS = 1000; // Loading time
```

---

## 📦 Optional: Enable True XLSX Export

Install SheetJS for native Excel support:

```bash
cd frontend
npm install xlsx
```

After installing, XLSX downloads will create true Excel files with:
- Native formatting
- Formula support (if added)
- Multiple sheets (if expanded)

Without `xlsx`, exports gracefully fall back to CSV with the same data.

---

## 🐛 Troubleshooting

### Issue: Lineage tooltips not showing
**Solution:** Ensure you're hovering over the colored dots (blue/purple), not just the cell

### Issue: "Continue to Export" disabled
**Solution:** You must complete AI agent review first (click button, wait 5s, click Continue)

### Issue: XLSX downloads as CSV
**Solution:** This is expected if `xlsx` is not installed. Install with `npm install xlsx` to enable true Excel export.

### Issue: Table showing fewer than 200 rows
**Solution:** Check if a filter is active (issue chips or search query). Clear filters to see all rows.

---

## 📸 Screenshots Guide

Take screenshots of:

1. **Merge page - Initial load** (skeleton)
2. **Merge page - Full table** with lineage dots
3. **Lineage tooltip** showing provenance
4. **Validation panel** with all chips
5. **Filtered view** (clicking a chip)
6. **AI Agent dialog - Loading** (progress bar)
7. **AI Agent dialog - Success** (report)
8. **Verified badge** in header
9. **Export page - Run summary**
10. **Download card** with both buttons

---

## 🎉 What's Built

✅ **2,000-row mock dataset** with full lineage tracking  
✅ **Rich preview table** with search and filtering  
✅ **12 validation issues** across 4 categories  
✅ **AI agent review** with realistic 5s animation  
✅ **CSV/XLSX export** with graceful fallback  
✅ **Full keyboard accessibility**  
✅ **Responsive design** (mobile to desktop)  
✅ **Dark mode support**  
✅ **Production-quality UI** with Tailwind + shadcn/ui  

**No backend calls** - All data is hard-coded in fixtures for demo purposes.

---

## 📚 Learn More

See `MERGE_EXPORT_IMPLEMENTATION.md` for:
- Complete file structure
- Component architecture
- Type definitions
- Performance notes
- Future enhancement ideas

---

**Happy Testing! 🚀**
