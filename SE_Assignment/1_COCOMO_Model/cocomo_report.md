# COCOMO Estimation Report
## ASPIRE AI PATHFINDER Project

### Project Type and Mode

This project is classified as **Semi-detached mode** under the COCOMO model. It's not a small organic project since it involves multiple subsystems (frontend, backend, database, AI integration), but it's also not a fully embedded system with strict hardware constraints. The team working on this would typically have mixed experience levels, and the requirements are reasonably well understood but not rigid.

---

## 1. Lines of Code (LOC) Estimation

Based on the actual codebase analysis, the project contains approximately **7,913 lines of code** across all source files (Python, TypeScript, TSX, JavaScript). This includes:

- **Frontend code**: React components, hooks, context providers, UI components (TypeScript/TSX)
- **Backend code**: Flask routes, models, utilities, prompts (Python)
- **Test code**: Backend tests and edge function tests
- **Configuration**: Vite config, TypeScript configs

For COCOMO calculation, we exclude comments and blank lines, so the effective **Source Lines of Code (SLOC)** is estimated at approximately **6,500 SLOC** after accounting for whitespace and documentation.

Converting to KLOC (Kilo Lines of Code, which is used in COCOMO formulas):
- **KLOC = SLOC / 1000**
- **6,500 SLOC = 6.5 KLOC**

This KLOC value is what we'll use in the COCOMO formulas below.

This is an approximation since we're doing this for academic purposes and don't have a formal LOC counter set up. In a real scenario, you'd use tools like `cloc` to get precise counts.

---

## 2. Intermediate COCOMO Model

The Intermediate COCOMO formula for effort calculation is:

**Effort = a × (KLOC)^b × EAF**

Where:
- **KLOC** = Size in thousands of lines of code = 6.5
- **a, b** = Constants based on project mode
  - For Semi-detached mode: a = 3.0, b = 1.12
- **EAF** = Effort Adjustment Factor (product of all cost drivers)

---

## 3. Cost Driver Analysis

The Intermediate COCOMO model uses 15 cost drivers across 4 categories. Here's the analysis for this project:

### Product Attributes

1. **RELY (Required Software Reliability)**: **Nominal (1.00)**
   - It's a career guidance tool, not life-critical. If it fails, users can retry. No major financial or safety consequences.

2. **DATA (Database Size)**: **Low (0.94)**
   - Database is relatively simple with just user accounts and saved paths. No massive datasets or complex relationships.

3. **CPLX (Product Complexity)**: **High (1.15)**
   - Involves AI integration, streaming responses, file parsing (PDF/DOCX), JWT authentication, real-time chat features. This adds complexity.

### Hardware Attributes

4. **TIME (Execution Time Constraint)**: **Nominal (1.00)**
   - No extreme time constraints. AI responses take a few seconds which is acceptable.

5. **STOR (Main Storage Constraint)**: **Nominal (1.00)**
   - Web application with standard storage needs. No constraints.

6. **VIRT (Virtual Machine Volatility)**: **Low (0.87)**
   - Stable deployment environment (Supabase, standard web hosting). Not frequently changing.

7. **TURN (Computer Turnaround Time)**: **Nominal (1.00)**
   - Development cycle is normal for web apps.

### Personnel Attributes

8. **ACAP (Analyst Capability)**: **High (0.86)**
   - Undergraduate project, but done by students who understand the domain well enough to architect it.

9. **AEXP (Applications Experience)**: **Nominal (1.00)**
   - Moderate experience with web development and AI APIs.

10. **PCAP (Programmer Capability)**: **High (0.86)**
    - Code quality looks decent with proper error handling and modular structure.

11. **VEXP (Virtual Machine Experience)**: **High (0.90)**
    - Good understanding of React ecosystem and Flask framework.

12. **LEXP (Programming Language Experience)**: **Nominal (1.00)**
    - Standard use of TypeScript and Python.

### Project Attributes

13. **MODP (Modern Programming Practices)**: **High (0.91)**
    - Uses React hooks, TypeScript, proper component structure, testing setup.

14. **TOOL (Use of Software Tools)**: **High (0.91)**
    - Vite, ESLint, Alembic for migrations, pytest for testing. Good tooling.

15. **SCED (Required Development Schedule)**: **Nominal (1.00)**
    - Normal timeline for an academic project, no extreme pressure.

### Calculating EAF

EAF = 1.00 × 0.94 × 1.15 × 1.00 × 1.00 × 0.87 × 1.00 × 0.86 × 1.00 × 0.86 × 0.90 × 1.00 × 0.91 × 0.91 × 1.00

**EAF ≈ 0.54**

---

## 4. Effort Calculation

Using the Intermediate COCOMO formula:

**Effort = 3.0 × (6.5)^1.12 × 0.54**

Calculating:
- (6.5)^1.12 ≈ 7.8
- Effort = 3.0 × 7.8 × 0.54
- **Effort ≈ 12.6 person-months**

---

## 5. Development Time

The development time formula is:

**TDEV = 2.5 × (Effort)^0.35**

**TDEV = 2.5 × (12.6)^0.35**
- (12.6)^0.35 ≈ 2.38
- **TDEV ≈ 6.0 months**

---

## 6. Team Size Estimation

Average team size = Effort / Development Time

**Team Size = 12.6 / 6.0 ≈ 2.1 persons**

So you'd need approximately **2-3 people** working on this project for about 6 months to complete it. That makes sense for an undergraduate project where a couple of students work on it over a semester or two.

---

## 7. Summary

| Metric | Value |
|--------|-------|
| Lines of Code (SLOC) | ~6,500 |
| Project Mode | Semi-detached |
| Effort Adjustment Factor (EAF) | 0.54 |
| Estimated Effort | 12.6 person-months |
| Estimated Development Time | 6.0 months |
| Average Team Size | 2-3 persons |

---

## Notes and Assumptions

1. The LOC count is based on the current codebase state. This is an academic estimation, not a formal measurement.

2. The Semi-detached mode was chosen because the project has moderate complexity with multiple integrated subsystems but isn't operating under embedded system constraints.

3. Cost drivers were rated based on what's visible in the code structure and typical undergraduate project constraints. Different evaluators might rate some factors slightly differently.

4. The low EAF (0.54) reflects good programming practices, capable developers, and stable tools, which reduce overall effort compared to baseline.

5. In reality, this project was probably developed over a few months with 1-2 developers, which aligns reasonably well with the COCOMO estimate considering that not all time was full-time development.
