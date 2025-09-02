@echo off
setlocal

:: Get a reliable, locale-independent timestamp
FOR /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') DO SET "dt=%%I"
SET "timestamp=%dt:~0,4%-%dt:~4,2%-%dt:~6,2% %dt:~8,2%:%dt:~10,2%:%dt:~12,2%"

:: 1. Add all changes
echo Staging all files...
git add .

:: 2. Commit with the clean timestamp
echo Committing with message: "Update: %timestamp%"
git commit -m "Update: %timestamp%"

:: 3. Push the changes
echo Pushing to remote...
git push

echo.
echo --- All done! ---
pause