# server/prompts.py
"""
This module contains functions that generate prompts for interacting with
the Google Generative AI (Gemini) model. Each function returns a list of strings,
which, when joined, form the complete prompt for a specific AI task.
"""

def get_resume_feedback_prompt(target_role: str, resume_text: str) -> list[str]:
    """
    Generates a prompt for the AI to review a resume for a specific target role.

    The AI is instructed to act as an expert career advisor and provide feedback
    on ATS compatibility, strengths, areas for improvement, keyword analysis,
    and an overall impression.

    Args:
        target_role (str): The job role the resume is being targeted for.
        resume_text (str): The text content of the resume.

    Returns:
        list[str]: A list of strings forming the prompt.
    """
    return [
        "You are an expert career advisor and resume reviewer.",
        "Analyze the following resume text for the target role for an ATS (Applicant Tracking System) and human recruiter:",
        f"Target Role: {target_role}\n\n",
        "Resume Text:\n",
        "```\n",
        resume_text,
        "\n```\n\n",
        "Provide detailed feedback covering these areas:\n"
        "1.  **ATS Compatibility Score (1-100):** Estimate how well this resume would pass through an ATS for the target role. Explain your reasoning briefly.",
        "2.  **Strengths:** What are the strongest parts of this resume for this role?",
        "3.  **Areas for Improvement:** What specific sections or points could be improved? Be actionable.",
        "4.  **Keyword Analysis:** Are relevant keywords for the target role present? Suggest missing keywords if any.",
        "5.  **Overall Impression & Suggestions:** Give a final summary and any other critical advice.",
        "\nFormat your response clearly, using markdown for headings and lists."
    ]

def get_role_suggestion_prompt(resume_text: str) -> list[str]:
    """
    Generates a prompt for the AI to suggest suitable career roles based on resume text.

    The AI is asked to act as a career counselor and suggest 3-5 roles,
    explaining the fit, key skills, and potential industries for each.

    Args:
        resume_text (str): The text content of the resume.

    Returns:
        list[str]: A list of strings forming the prompt.
    """
    return [
        "You are an expert career counselor and talent acquisition specialist.",
        "Based on the following resume text, identify the top 3-5 most suitable career roles for this individual. ",
        "For each suggested role, provide:",
        "   a. Role Title",
        "   b. A brief explanation (2-3 sentences) why this role is a good fit based on the resume.",
        "   c. Key skills from the resume that align with this role.",
        "   d. Potential industries where this role is common.",
        "\nResume Text:\n",
        "```\n",
        resume_text,
        "\n```\n\n",
        "Consider a diverse range of roles, including those that might be a slight pivot but leverage existing strengths.",
        "Format your response as a list of suggestions, using markdown for clarity (e.g., headings for each role)."
    ]

def get_career_exploration_prompt(career_field: str) -> list[str]:
    """
    Generates a prompt for the AI to create a detailed report on a specified career field.

    The AI is instructed to act as a career analyst and cover aspects like overview,
    responsibilities, skills, education, salary, outlook, pros/cons, and example job titles.

    Args:
        career_field (str): The name of the career field to generate a report for.

    Returns:
        list[str]: A list of strings forming the prompt.
    """
    return [
        f"You are an expert career analyst and industry researcher.",
        f"Generate a detailed report on the career field: '{career_field}'.",
        "The report should include the following sections:",
        "1.  **Overview:** A brief description of the field.",
        "2.  **Key Responsibilities:** Common tasks and duties.",
        "3.  **Required Skills:** Technical and soft skills needed.",
        "4.  **Educational Pathways:** Typical degrees or certifications.",
        "5.  **Salary Expectations:** General salary ranges (mention variability by location/experience).",
        "6.  **Career Outlook & Trends:** Future prospects and developments in the field.",
        "7.  **Pros & Cons:** Advantages and disadvantages of working in this field.",
        "8.  **Example Job Titles:** A few common job titles within this field.",
        "\nFormat the report clearly, using markdown for headings, lists, and emphasis."
    ]
