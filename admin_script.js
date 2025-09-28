// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyAXlEha6cyLALeVfE7Uhlh3cqU1yFpdDlQ",
    authDomain: "student-app-939d7.firebaseapp.com",
    databaseURL: "https://student-app-939d7-default-rtdb.firebaseio.com",
    projectId: "student-app-939d7",
    storageBucket: "student-app-939d7.appspot.com",
    messagingSenderId: "614984408185",
    appId: "1:614984408185:web:1f402a120ff92421fb08a8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// --- Admin Authentication ---
// IMPORTANT: For a real app, you should create a specific admin user in Firebase Authentication.
// We will use a simple email/password check here for ease of use.
const ADMIN_EMAIL = "admin@learnapp.com"; // Change this to your desired admin email
const ADMIN_PASSWORD = "adminpassword"; // Change this to a strong password

function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('admin-error');

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        errorEl.textContent = '';
        initializeApp();
    } else {
        errorEl.textContent = "Invalid admin credentials.";
    }
}

// --- App Initialization ---
function initializeApp() {
    // Populate class dropdown
    const classSelect = document.getElementById('lesson-class');
    for (let i = 1; i <= 10; i++) {
        classSelect.innerHTML += `<option value="${i}th">${i}th</option>`;
    }

    // Add event listeners to load subjects when class/medium changes
    document.getElementById('lesson-class').addEventListener('change', loadSubjects);
    document.getElementById('lesson-medium').addEventListener('change', loadSubjects);

    // Handle the lesson form submission
    document.getElementById('lesson-form').addEventListener('submit', saveLesson);
}

// --- Dynamic Subject Loading ---
function loadSubjects() {
    const classVal = document.getElementById('lesson-class').value;
    const mediumVal = document.getElementById('lesson-medium').value;
    const subjectSelect = document.getElementById('lesson-subject');
    subjectSelect.innerHTML = '<option value="">Loading Subjects...</option>';

    if (!classVal || !mediumVal) {
        subjectSelect.innerHTML = '<option value="">Select Class and Medium first</option>';
        return;
    }

    const path = `subjects/${classVal}/${mediumVal}`;
    database.ref(path).once('value', snapshot => {
        if (snapshot.exists()) {
            const subjects = snapshot.val();
            subjectSelect.innerHTML = '<option value="">Select Subject</option>';
            for (const id in subjects) {
                subjectSelect.innerHTML += `<option value="${id}">${subjects[id].name}</option>`;
            }
        } else {
            subjectSelect.innerHTML = '<option value="">No subjects found. Add them in the database first.</option>';
        }
    });
}

// --- Q&A Management ---
let qnaCount = 0;
function addQnaPair() {
    qnaCount++;
    const container = document.getElementById('qna-container');
    const newPair = document.createElement('div');
    newPair.id = `qna-pair-${qnaCount}`;
    newPair.className = 'grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 border-t pt-2';
    newPair.innerHTML = `
        <input type="text" placeholder="Question ${qnaCount}" class="qna-question w-full p-2 border rounded-lg" required>
        <div class="flex">
            <input type="text" placeholder="Answer ${qnaCount}" class="qna-answer w-full p-2 border rounded-lg" required>
            <button type="button" onclick="removeQnaPair(${qnaCount})" class="ml-2 text-red-500 hover:text-red-700 p-2"><i class="fas fa-trash"></i></button>
        </div>
    `;
    container.appendChild(newPair);
}

function removeQnaPair(id) {
    document.getElementById(`qna-pair-${id}`).remove();
}


// --- Save Lesson Data to Firebase ---
function saveLesson(e) {
    e.preventDefault();
    const successMessage = document.getElementById('success-message');
    successMessage.textContent = 'Saving...';

    const classVal = document.getElementById('lesson-class').value;
    const mediumVal = document.getElementById('lesson-medium').value;
    const subjectId = document.getElementById('lesson-subject').value;
    
    // Collect Q&A data
    const qnaData = [];
    const qnaPairs = document.querySelectorAll('#qna-container > div');
    qnaPairs.forEach(pair => {
        const question = pair.querySelector('.qna-question').value;
        const answer = pair.querySelector('.qna-answer').value;
        if (question && answer) {
            qnaData.push({ question, answer });
        }
    });

    const lessonData = {
        title: document.getElementById('lesson-title').value,
        freeContent: document.getElementById('free-content').value,
        fullContent: document.getElementById('full-content').value,
        isPaid: document.getElementById('is-paid').checked,
        qna: qnaData,
        pdfUrl: null // PDF functionality can be added here later
    };

    // Generate a new unique ID for the lesson
    const newLessonRef = database.ref(`lessons/${classVal}/${mediumVal}/${subjectId}`).push();
    
    newLessonRef.set(lessonData)
        .then(() => {
            successMessage.textContent = 'Lesson saved successfully!';
            document.getElementById('lesson-form').reset();
            document.getElementById('qna-container').innerHTML = '<h3 class="text-lg font-semibold mt-4">Questions & Answers</h3>'; // Reset Q&A
            setTimeout(() => successMessage.textContent = '', 3000);
        })
        .catch(error => {
            console.error("Error saving lesson:", error);
            successMessage.textContent = 'Error saving lesson. Check console for details.';
        });
}
