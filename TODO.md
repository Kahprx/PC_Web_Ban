# PC Store - Fix Home Detail Title Task

## Information
The task is to remove 'DETAIL TITLE' from Home page near sections (home-detail-strip-head h3), restore original.

## Plan Steps
- [x] Read Home.jsx - identified <header className=\"home-detail-strip-head\"><h3>{detailTitleById[section.id] || section.title}</h3>...</header>
- [x] Remove the detailTitleById const
- [x] Remove the entire <header className=\"home-detail-strip-head\"> block in home-detail-strip articles
- [x] Test home page
- [x] Complete

