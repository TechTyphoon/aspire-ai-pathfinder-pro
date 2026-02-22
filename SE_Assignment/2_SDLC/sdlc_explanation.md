# SDLC Model Explanation
## ASPIRE AI PATHFINDER Project

### Chosen SDLC Model: **Iterative and Incremental Model**

---

## Why This Model Fits Our Project

For ASPIRE AI PATHFINDER, we used an iterative and incremental approach rather than pure waterfall or pure agile. Here's why this made sense:

### 1. Incremental Feature Development

The project wasn't built all at once. We developed it in increments:

- **First increment**: Basic authentication (login/signup), database setup
- **Second increment**: Resume upload and text extraction functionality
- **Third increment**: AI integration for resume analysis
- **Fourth increment**: Role suggestion feature
- **Fifth increment**: Career exploration and saved paths
- **Sixth increment**: AI chat assistant

Each increment added a new working feature to the system. We could test authentication before moving to file uploads, test file parsing before adding AI, etc.

### 2. Iterative Refinement

Within each increment, we iterated. For example, with resume analysis:
- First iteration: Basic analysis with simple prompts
- Second iteration: Added structured feedback sections
- Third iteration: Improved error handling and loading states
- Fourth iteration: Added progress indicators and animations

### 3. Uncertain Requirements Around AI

When we started, we weren't 100% sure how the AI features would work. What kind of prompts would give good results? How should we structure the career path data? The iterative model let us experiment and adjust based on what worked.

### 4. Continuous Feedback Loop

Being a student project, we could get feedback from peers and instructors between increments. If something wasn't working well (like the initial UI for displaying analysis results), we could fix it in the next iteration without disrupting the entire project.

### 5. Risk Management

Integrating with external APIs (Gemini AI, file parsing libraries) had risks. By tackling these in separate increments, if something failed completely, we didn't have to restart the entire project.

---

## Why Not Other Models?

**Waterfall?**  
Too rigid. We couldn't define all requirements upfront because we were learning about AI integration as we went. Also, finding bugs late in waterfall would be costly to fix.

**Pure Agile/Scrum?**  
Too much overhead for a small academic team. Daily standups and sprint planning might be overkill when you're 2 students coordinating already. We needed structure but not that much process.

**Prototyping?**  
We did use prototypes (like UI mockups), but building the whole thing as throwaway prototypes wouldn't work when we needed a functioning system at the end.

**Spiral?**  
Closer, but spiral is more for large-scale projects with major risk analysis phases. Our risks were manageable with simpler iteration.

---

## How It Worked in Practice

The development roughly followed this pattern:

1. **Plan**: Decide on the next feature to add (e.g., "Add AI chat functionality")
2. **Design**: Sketch out the API endpoints, database changes, UI components needed
3. **Implement**: Write the code for that increment
4. **Test**: Test the new feature in isolation and with existing features
5. **Deploy/Review**: Push to the test environment, get feedback
6. **Iterate**: Fix bugs, improve based on feedback
7. **Repeat**: Move to next increment

This cycle repeated for each major feature. Sometimes we'd go back and refactor earlier increments when we learned better patterns.

---

## Benefits We Actually Experienced

1. **Working software early**: Had a basic version with auth working within the first few weeks
2. **Flexibility**: Could adjust feature priorities based on what was harder than expected
3. **Lower risk**: If AI integration was taking too long, we still had a working system without it
4. **Better testing**: Easier to test smaller increments than the whole system at once
5. **Learning as we go**: Improved code quality in later increments based on lessons from earlier ones

---

## Trade-offs

Not everything was perfect:
- Sometimes refactoring earlier code took time when we learned better approaches
- Database migrations got messier as we changed our minds about schema
- Some features had dependencies that forced us to finish one increment before starting another

But overall, the iterative incremental model gave us the right balance of structure and flexibility for a project like this.
