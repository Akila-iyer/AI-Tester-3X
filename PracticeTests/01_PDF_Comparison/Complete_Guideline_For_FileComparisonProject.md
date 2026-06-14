# File Comparison Tool — Complete Guide

A step-by-step guide for QA teams to compare two files (PDF, Word, Excel, or CSV) and get a detailed Pass/Fail report.

---

## Table of Contents

1. [What Does This Tool Do?](#what-does-this-tool-do)
2. [What File Types Are Supported?](#what-file-types-are-supported)
3. [How to Set Up (One-Time Only)](#how-to-set-up-one-time-only)
4. [How to Run the Tool](#how-to-run-the-tool)
5. [How to Use the Tool (Step by Step)](#how-to-use-the-tool-step-by-step)
6. [Understanding the Reports](#understanding-the-reports)
7. [Troubleshooting](#troubleshooting)
8. [Project Structure Overview](#project-structure-overview)

---

## What Does This Tool Do?

This tool compares **two files** side-by-side — line by line — and tells you exactly what's different.

**Example Scenario:** You have an old PDF invoice and a new PDF invoice. Upload both, click Execute, and the tool will tell you which lines match (PASS) and which lines don't (FAIL).

**Output you get (3 files):**
| Report | What's Inside |
|--------|---------------|
| **Excel file** | Every line compared, color-coded green (PASS) / red (FAIL) |
| **Markdown file** | Summary stats + a table of all differences |
| **Log file** | Timestamped log of exactly what was compared |

---

## What File Types Are Supported?

| File Type | Extension | Notes |
|-----------|-----------|-------|
| PDF | `.pdf` | Text content only (scanned/image PDFs won't work) |
| Word | `.docx` | Paragraphs + table cells extracted |
| Excel | `.xlsx` or `.xls` | All sheets flattened, cell by cell |
| CSV | `.csv` | Each row's cells joined together |

**Important:** You can compare different file types too — for example, compare a PDF with a Word file. The tool doesn't care what the formats are; it just compares the text inside.

---

## How to Set Up (One-Time Only)

You only need to do this **once** on your computer.

### Step 1: Install Python

1. Go to https://www.python.org/downloads/
2. Download the latest Python (3.12 or newer)
3. During installation, **check the box** that says **"Add Python to PATH"**
4. Click Install and wait for it to finish

### Step 2: Open Command Prompt / Terminal

- **Windows:** Press `Windows Key + R`, type `cmd`, press Enter
- **Mac:** Press `Cmd + Space`, type `terminal`, press Enter

### Step 3: Navigate to the Project Folder

Type this and press Enter:

```
cd "D:\AI-Tester-Learning\PracticeTests\01_PDF_Comparison"
```

(If you moved the folder somewhere else, use that path instead.)

### Step 4: Install Dependencies (One-Time)

Copy-paste this into the command prompt and press Enter:

```
pip install pdfplumber python-docx openpyxl flask pandas
```

Wait for it to finish — it will show a bunch of text ending with "Successfully installed..."

**That's it!** Setup is done.

---

## How to Run the Tool

Every time you want to use the tool:

1. Open Command Prompt
2. Type and press Enter:
   ```
   cd "D:\AI-Tester-Learning\PracticeTests\01_PDF_Comparison"
   ```
3. Type and press Enter:
   ```
   python app.py
   ```
4. You'll see some text appear. Open your browser and go to:
   **http://localhost:5000**

You should see a clean web page with two upload boxes labeled "Base File" and "Compare File".

---

## How to Use the Tool (Step by Step)

### Step 1: Upload Your Files

- Click on the **"Base File"** box (this is your expected/original file)
- Select your file from your computer
- Click on the **"Compare File"** box (this is the file you want to test)
- Select the second file

Both boxes should now show green checkmarks with the file names.

### Step 2: Click "Execute Comparison"

- The button was grayed out before — now it's purple and clickable
- Click **"🚀 Execute Comparison"**
- A spinner will appear while the tool works

### Step 3: View Your Results

Once comparison finishes, you'll see:

- **Summary cards:** Total Lines, Pass count (green), Fail count (red), Pass Rate %
- **Download buttons:** Excel, Markdown, and Log

### Step 4: Download Reports

Click any of the three buttons to download:
- **📊 Excel** — Best for sharing with team / importing into spreadsheets
- **📝 Markdown** — Best for attaching to bug reports or tickets
- **📋 Log** — Best for debugging and traceability

### Step 5: Keep Running More Comparisons

You can upload new files and click Execute again. Each run generates a fresh set of reports.

When you're done, close the browser tab and press **Ctrl+C** in the command prompt to stop the server.

---

## Understanding the Reports

### Excel Report

| Line # | Base Text | Compare Text | Status |
|--------|-----------|--------------|--------|
| 1 | Invoice #12345 | Invoice #12345 | ✅ PASS |
| 2 | Total: $100.00 | Total: $150.00 | ❌ FAIL |
| 3 | Due: 01-Jan-2025 | Due: 01-Jun-2025 | ❌ FAIL |

- **Green rows** = Content matches
- **Red rows** = Content differs
- Empty cells mean one file had extra lines the other didn't

### Markdown Report

Shows a summary at the top (total, pass, fail, pass rate) with a table of all lines below.

### Log File

A timestamped record showing exactly when each step happened and listing every failure in detail with what was expected vs what was found.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `python is not recognized` | Python wasn't added to PATH. Reinstall Python and check "Add to PATH". |
| `ModuleNotFoundError` | You didn't run `pip install ...`. Run the install command from Step 4. |
| Page doesn't load at `localhost:5000` | Make sure `python app.py` is still running in the command prompt. |
| PDF extracted as empty | The PDF might be scanned images — this tool only reads text PDFs. |
| "Address already in use" error | Another program is on port 5000. Close other apps or restart your computer. |

### Quick Health Check

To verify everything is installed correctly, run this command:

```
python -c "import flask; import openpyxl; import pdfplumber; import docx; print('All good!')"
```

If it prints "All good!", you're ready.

---

## Project Structure Overview

```
01_PDF_Comparison/
│
├── app.py                  # The main program — run this to start
├── templates/
│   └── index.html          # The web page you see in the browser
├── tools/
│   ├── extractor.py        # Reads content from PDF/Word/Excel/CSV
│   ├── comparator.py       # Compares two files line by line
│   └── reporter.py         # Creates the Excel/Markdown/Log reports
├── architecture/           # Technical documentation (for developers)
├── output/                 # Your downloaded reports go here
├── gemini.md               # Project rules and data structure
├── task_plan.md            # What was planned
├── findings.md             # What was learned
└── progress.md             # What was done
```

**You don't need to touch any of these files.** Just run `python app.py` and use the web interface.

---

*Generated on: 2026-06-14 | Built with B.L.A.S.T. framework*
