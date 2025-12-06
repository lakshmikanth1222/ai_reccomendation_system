# app.py

import json
import re
import fitz  # PyMuPDF
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- SKILLS DICTIONARY FOR RESUME ANALYSIS ---
# A comprehensive list of skills to look for in a resume.
SKILLS_DB = [
    'python', 'java', 'c++', 'javascript', 'sql', 'html/css', 'react', 'node.js', 'angular', 'vue.js',
    'data analysis', 'machine learning', 'deep learning', 'nlp', 'natural language processing', 'computer vision',
    'statistical modeling', 'data mining', 'data visualization', 'tableau', 'power bi', 'pandas', 'numpy', 'scipy',
    'matplotlib', 'seaborn', 'keras', 'tensorflow', 'pytorch', 'scikit-learn', 'git', 'docker', 'kubernetes',
    'cloud computing', 'aws', 'azure', 'gcp', 'google cloud platform', 'devops', 'ci/cd', 'jenkins', 'ansible',
    'terraform', 'linux', 'shell scripting', 'bash', 'network security', 'cybersecurity', 'penetration testing',
    'digital forensics', 'agile methodologies', 'scrum', 'project management', 'product management', 'jira',
    'communication', 'teamwork', 'problem solving', 'critical thinking', 'leadership', 'time management',
    'attention to detail', 'creativity', 'emotional intelligence', 'public speaking', 'negotiation',
    'user research', 'ui/ux design', 'figma', 'adobe xd', 'sketch', 'prototyping', 'wireframing', 'user flows',
    'graphic design', 'adobe creative suite', 'photoshop', 'illustrator', 'indesign', 'autocad', 'solidworks',
    'content creation', 'copywriting', 'seo', 'sem', 'social media marketing', 'email marketing', 'google analytics',
    'financial modeling', 'excel', 'vba', 'quantitative analysis', 'risk management', 'investment banking',
    'wealth management', 'accounting', 'auditing', 'supply chain', 'operations management', 'logistics',
    'business development', 'sales', 'crm', 'salesforce', 'customer relationship management', 'hr', 'human resources',
    'talent acquisition', 'recruiting', 'swift', 'kotlin', 'android studio', 'xcode', 'mobile development',
    'restful apis', 'apis', 'graphql', 'microservices', 'data structures', 'algorithms', 'testing', 'qa',
    'quality assurance', 'selenium', 'jest', 'mocha', 'chai', 'circuit design', 'vhdl', 'verilog',
    'medical terminology', 'biology', 'chemistry', 'pharmacology', 'lab techniques', 'healthcare systems (ehr/emr)',
    'typing speed', 'bioinformatics', 'genomics'
]

# Load internship data from the JSON file
try:
    with open('internships.json', 'r', encoding='utf-8') as f:
        internships = json.load(f)
    print(f"Successfully loaded {len(internships)} internships")
except FileNotFoundError:
    internships = []
    print("FATAL ERROR: internships.json not found. The application cannot run without data.")
except json.JSONDecodeError as e:
    internships = []
    print(f"FATAL ERROR: internships.json is not a valid JSON file. Error: {e}")

# --- AI Model Pre-processing (only if internships were loaded) ---
if internships:
    try:
        corpus = []
        for internship in internships:
            text = (f"{internship['title']}. {internship['description']}. "
                    f"Required skills are {' '.join(internship['required_skills'])}. "
                    f"Sector: {internship['sector']}, Field: {internship['field']}, Branch: {internship.get('branch', '')}.")
            corpus.append(text)

        tfidf_vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        tfidf_matrix = tfidf_vectorizer.fit_transform(corpus)
        print("TF-IDF model successfully initialized")
    except Exception as e:
        print(f"Error initializing TF-IDF model: {e}")
        tfidf_matrix = None
        tfidf_vectorizer = None
else:
    tfidf_matrix = None
    tfidf_vectorizer = None

# --- API Endpoints ---

@app.route('/analyze-resume', methods=['POST'])
def analyze_resume():
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file provided'}), 400
    
    file = request.files['resume']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    try:
        pdf_document = fitz.open(stream=file.read(), filetype="pdf")
        resume_text = "".join(page.get_text() for page in pdf_document)
        pdf_document.close()
        
        resume_text_lower = resume_text.lower()
        found_skills = set()

        for skill in SKILLS_DB:
            if re.search(r'\b' + re.escape(skill) + r'\b', resume_text_lower):
                # Standardize capitalization for display
                clean_skill = skill.title().replace('Ui/Ux', 'UI/UX').replace('Html/Css', 'HTML/CSS')
                found_skills.add(clean_skill)

        return jsonify({'skills': sorted(list(found_skills))})

    except Exception as e:
        print(f"Error processing resume: {e}")
        return jsonify({'error': 'Failed to process resume. Please ensure it is a valid PDF.'}), 500


@app.route('/recommend', methods=['POST'])
def recommend():
    if not internships or tfidf_matrix is None or tfidf_vectorizer is None:
        return jsonify({'error': 'Server is not ready. No internship data loaded or model initialization failed.'}), 500

    try:
        user_data = request.get_json()
        if not user_data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        recommendations = generate_recommendations(user_data)
        return jsonify(recommendations)
    
    except Exception as e:
        print(f"An error occurred during recommendation: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

def generate_recommendations(user_data):
    education = user_data.get('education', '')
    field = user_data.get('field', '')
    branch = user_data.get('branch', '')
    skills = user_data.get('skills', [])
    sector = user_data.get('sector', '')
    state = user_data.get('state', '')

    user_profile_text = (f"A candidate with skills in {' '.join(skills)}, from the {field} field and {branch} branch, "
                         f"interested in the {sector} sector.")
    
    user_tfidf_vector = tfidf_vectorizer.transform([user_profile_text])
    cosine_similarities = cosine_similarity(user_tfidf_vector, tfidf_matrix).flatten()
    
    scored_internships = []
    user_skills_set = set(skill.lower() for skill in skills)

    for i, internship in enumerate(internships):
        content_score = cosine_similarities[i] * 50
        required_skills_set = set(skill.lower() for skill in internship['required_skills'])
        matched_skills = list(user_skills_set.intersection(required_skills_set))
        missing_skills = list(required_skills_set.difference(user_skills_set))
        
        skill_match_percentage = len(matched_skills) / len(required_skills_set) if required_skills_set else 1.0
        skill_score = skill_match_percentage * 35
        
        filter_score = 0
        if education and internship.get('education') in education: 
            filter_score += 5
        if not state or (internship.get('location') in [state, 'Remote']): 
            filter_score += 5
        if branch and internship.get('branch') == branch: 
            filter_score += 5
        
        opportunity_bonus = 5 if 1 <= len(missing_skills) <= 2 and skill_match_percentage >= 0.6 else 0
        
        total_score = content_score + skill_score + filter_score + opportunity_bonus
        
        # Lowered threshold to ensure more matches appear
        if total_score > 30:
            matched_skills_display = [s.replace('_', ' ').title().replace('Ui/Ux', 'UI/UX') for s in matched_skills]
            missing_skills_display = [s.replace('_', ' ').title().replace('Ui/Ux', 'UI/UX') for s in missing_skills]
            
            scored_internships.append({
                **internship,
                'match': min(round(total_score), 99),
                'explainability': {
                    'matched_skills': matched_skills_display,
                    'missing_skills': missing_skills_display,
                    'is_opportunity': opportunity_bonus > 0
                }
            })
    
    scored_internships.sort(key=lambda x: x['match'], reverse=True)
    return scored_internships[:9]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify server is running"""
    status = {
        'status': 'ok' if internships and tfidf_matrix is not None else 'error',
        'internships_loaded': len(internships),
        'model_initialized': tfidf_matrix is not None
    }
    return jsonify(status)

if __name__ == '__main__':
    print("Starting Flask server...")
    print("Available endpoints:")
    print("  POST /analyze-resume - Analyze resume PDF")
    print("  POST /recommend - Get internship recommendations")
    print("  GET /health - Health check")
    app.run(debug=True, port=5000)