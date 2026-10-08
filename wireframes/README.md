# wireframes/

Static HTML exports of the design canvas, 1920×1080. Open in a browser; nav
links between screens work. They define **what each screen contains and where**.
Colors/fonts come from docs/UI.md, not from here (wireframes are grayscale).
Blue numbered circles are annotation markers, not UI.

| File | Screen | Spec |
|---|---|---|
| WfHome.html | FE 1 Home | docs/TILES.md, docs/UI.md |
| WfProjects.html | FE 2 Projects | docs/UI.md "Page templates" |
| WfProjectDetail.html | FE 3 Project detail | docs/UI.md |
| WfAbout.html | FE 4 About | docs/UI.md, Q-004 |
| WfBlog.html | FE 5 Blog | docs/UI.md |
| WfBlogPost.html | FE 6 Blog post | docs/UI.md |
| WfLogin.html | DB 1 Login | docs/AUTH.md |
| WfLayoutEditor.html | DB 2 Layout editor | docs/DASHBOARD.md |
| WfTileLibrary.html | DB 3 Add tile modal | docs/DASHBOARD.md |
| WfProjectsManager.html | DB 4 Projects manager | docs/DASHBOARD.md |
| WfProjectEditor.html | DB 5 Project editor | docs/DASHBOARD.md |
| WfPostEditor.html | DB 6 Post editor | docs/DASHBOARD.md |

## Where the specs override the wireframes

| Wireframe shows | Spec says | Ref |
|---|---|---|
| Magic-link email form on login | GitHub button only | D-006 |
| Sidebar "Pages", "Theme" items | Removed; page switch is in the layout editor header | D-007, docs/UI.md |
| Desktop / Mobile toggle | Desktop / Stacking order | D-008 |
| Add-tile: GitHub activity, Now playing, Custom embed | Not in v1 | D-009 |
| Project editor "Page blocks" list | One Markdown body field | D-010 |
| Post editor "[N] views" | No view counts | D-014 |
| About "Download résumé" tile | Undecided | Q-004 |
| Project detail video play button | Images only unless Q-006 says otherwise | Q-006 |
| Placeholder text `[YEAR]`, `[CONTEST]`, etc. | Real content pending — never invent | Q-002 |
