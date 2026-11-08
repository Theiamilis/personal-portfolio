# My little corner

A personal profile and technical portfolio website with a minimalist ice-blue, navy, black, and silver aesthetic.

## Local Preview

Double-click `index.html` to open the website in your browser. No build steps or package installations are required.

To run a local HTTP preview server, open a terminal in this directory and execute:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:4173/`. Press `Ctrl+C` in the terminal to stop the server.

## Project Structure

```text
profile_web/
├── index.html
├── assets/
│   ├── css/style.css
│   ├── cv/arief-setiawan-cv.html
│   ├── images/ribbon-blue.png
│   └── js/destination-wheel.js
└── README.md
```

- Edit profile content, experience, skills, projects, and contact links in `index.html`.
- The downloadable/printable CV template is located at `assets/cv/arief-setiawan-cv.html`.
- Modify layout and visual styles in `assets/css/style.css`.
- Additional images can be stored in `assets/images/`.
- The desktop view features an identity card and curved destination wheel on the left, with the active content panel displayed on the right. Destinations can be navigated via click or arrow keys (`Left`/`Right`/`Up`/`Down`, `Home`, and `End`). On smaller screens, the layout stacks vertically. Standard navigation links provide a fallback if JavaScript is disabled.
- Profile content covers Arief Setiawan's technical work across IT systems, network infrastructure, and hardware engineering. Contact channels are provided via Email, LinkedIn, and GitHub.
- Google Fonts load automatically with internet access; fallback system fonts are used when offline.
