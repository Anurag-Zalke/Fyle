const API_URL = "https://api.github.com/users/";
const ACCESS_TOKEN = "ADD_TOKEN_HERE";

const main = document.getElementById("main");
const searchBox = document.getElementById("search");
const userLoader = document.getElementById("userLoader");
const repoLoader = document.getElementById("repoLoader");
const reposContainer = document.getElementById("repoContainer");
let currentPage = 1; // Initialize the current page
let username = ""; // Global variable to store the username
let perPage = 10; // Default value for repositories per page

const getUser = async (inputUsername) => {
    try {
        userLoader.style.display = "block"; // Show user loader

        const response = await fetch(API_URL + inputUsername, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
        });

        userLoader.style.display = "none"; // Hide user loader

        const data = await response.json();
        const card = `
            <div class="card">
                <div>
                    <img src="${data.avatar_url}" alt="image" class="avatar">
                </div>
                <div class="user-info">
                    <h2>${data.name}</h2>
                    <p>${data.bio}</p>

                    <ul class="info">
                        <li>${data.followers}<strong>Followers</strong></li>
                        <li>${data.following}<strong>Following</strong></li>
                        <li>${data.public_repos}<strong>Repos</strong></li>
                    </ul>

                    <div id="repoContainer" class="repo-container"></div>
                    <div id="pagination" class="pagination"></div>
                    <div class="loader" id="repoLoader"></div>
                </div>
            </div>
        `;
        main.innerHTML = card;

        // Update the global variables with the current values
        username = data.login;
        currentPage = 1;

        // Call getRepos with the correct parameters
        getRepos(username, currentPage, perPage);
        createPagination(username, currentPage, perPage);
    } catch (error) {
        userLoader.style.display = "none"; // Hide user loader
        console.log(error.response.status);
        if (error.response.status == 404) {
            createErrorCard('No profile with this Username');
        } else {
            createErrorCard('Error fetching user data');
        }
    }
};

const getRepos = async (username, page = 1, perPage = 10) => {
    try {
        repoLoader.style.display = "block"; // Show repo loader

        const response = await fetch(`${API_URL}${username}/repos?page=${page}&per_page=${perPage}`, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
        });

        const reposData = await response.json();

        if (reposData.length === 0) {
            createErrorCard('No repositories available.');
            return;
        }

        reposContainer.innerHTML = ""; // Clear previous repositories

        for (const repo of reposData) {
            const repoInfoResponse = await fetch(repo.url);
            const repoInfo = await repoInfoResponse.json();

            const repoElement = document.createElement("div");
            repoElement.classList.add("repo");

            const repoLink = document.createElement("a");
            repoLink.href = repo.html_url;
            repoLink.target = "_blank";
            repoLink.innerText = repo.name;

            const repoDescription = document.createElement("p");
            repoDescription.innerText = repo.description || "No description available.";

            const repoTechInfo = document.createElement("p");
            repoTechInfo.innerText = `Language: ${repo.language || 'Not specified'}`;

            repoElement.appendChild(repoLink);
            repoElement.appendChild(repoDescription);
            repoElement.appendChild(repoTechInfo);

            reposContainer.appendChild(repoElement);
        }
        repoLoader.style.display = "none";

        createPagination(username, page, perPage); // Add pagination controls
    } catch (error) {
        repoLoader.style.display = "none"; // Hide repo loader
        createErrorCard('Error fetching repositories');
    }
};

const createPagination = (username, currentPage, perPage) => {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = ""; // Clear previous pagination controls

    const totalRepos = document.querySelector(".user-info li:nth-child(3)").innerText.split(" ")[0];
    const totalPages = Math.ceil(totalRepos / perPage);

    // Include the "Previous Page" button
    const prevButton = document.createElement("button");
    prevButton.innerText = "Previous Page";
    prevButton.id = "prevPage";
    prevButton.onclick = () => changePage(-1);

    // Include the page buttons
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.innerText = i;
        button.addEventListener("click", () => {
            currentPage = i;
            getRepos(username, currentPage, perPage);
            updatePaginationInfo();
        });

        if (i === currentPage) {
            button.classList.add("active");
        }

        paginationContainer.appendChild(button);
    }

    // Include the "Next Page" button
    const nextButton = document.createElement("button");
    nextButton.innerText = "Next Page";
    nextButton.id = "nextPage";
    nextButton.onclick = () => changePage(1);

    // Display the current page information
    const pageInfo = document.createElement("span");
    pageInfo.innerHTML = `<div class="page-display">Page <span id="currentPage">${currentPage}</span></div>`;

    // Append the elements to the pagination container in the desired order
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
};


const changePage = (delta) => {
    currentPage += delta;
    if (currentPage < 1) {
        currentPage = 1;
    }
    // Call the getRepos function with the updated page number
    getRepos(username, currentPage, perPage);
    // Update the pagination information
    updatePaginationInfo();
};


const updatePaginationInfo = () => {
    const currentPageElement = document.getElementById("currentPage");
    currentPageElement.innerText = currentPage;
};

const formSubmit = () => {
    if (searchBox.value !== "") {
        getUser(searchBox.value);
        searchBox.value = "";
    }
    return false;
};

searchBox.addEventListener("focusout", formSubmit);

const createErrorCard = (msg) => {
    const cardHTML = `
        <div class="card">
            <h1>${msg}</h1>
        </div>
    `;
    main.innerHTML = cardHTML;
};

// Initial call to createPagination with the current page information
createPagination(username, currentPage, perPage);
