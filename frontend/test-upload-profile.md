# Upload & Profile Page - Testing Guide

## How to Test

1. **Enable Mock Mode**:
   - Set `VITE_MOCK=1` in your `.env` file or environment
   - This will use the MockService instead of real API calls

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```

3. **Navigate to the Page**:
   - Go to `http://localhost:8084/' (now the home page)
   - Or `http://localhost:8084/upload-profile` (alternative URL)

4. **Test File Upload**:
   - Click on "Bank A" file picker
   - Select multiple CSV or XLSX files (up to 8 files)
   - Click on "Bank B" file picker  
   - Select multiple CSV or XLSX files (up to 8 files)
   - Verify all files show with names and sizes
   - Test adding more files with "Add More Files" button
   - Test removing individual files with the X button
   - Test clearing all files with the clear button

5. **Test Action Key (Secure Mode)**:
   - Since `secureMode = true` in config, you'll see an action key input
   - Enter any text (e.g., "test123")
   - The "Start Run" button should become enabled

6. **Test Run Start**:
   - Click "Start Run"
   - You should see:
     - A run ID generated (format: RUN-YYYYMMDD-HHMMSS-XXXX)
     - A copy button for the run ID
     - Loading skeletons for profiles
     - After ~800ms, profile data should appear
     - Row counts should reflect the number of files uploaded

7. **Test Profile Display**:
   - Verify both Bank A and Bank B profiles show:
     - Stats cards (rows sampled, columns, high blanks, likely keys)
     - Likely keys with progress bars and tooltips
     - Column statistics table with types, blanks %, examples
   - Click "View Sample" to expand sample rows
   - Click "Hide Sample" to collapse

8. **Test Secure Mode Masking**:
   - In secure mode, example values and sample data should be masked
   - Letters become "x", digits become "#"
   - Verify the secure mode badge shows "ON"

9. **Test Keyboard Accessibility**:
   - Tab through all interactive elements
   - Use Enter/Space on file pickers and buttons
   - Use Escape to close tooltips
   - Verify focus rings are visible

10. **Test Error Handling**:
    - Try uploading files >20MB (should show error)
    - Try uploading non-CSV/XLSX files (should show error)
    - Try uploading more than 8 files (should show error)
    - Try starting run without action key (should show error)
    - Try starting run without files (should show error)

## Expected Behavior

- **Fast Loading**: Initial render under 50ms
- **Smooth Interactions**: All animations and transitions work
- **Responsive Design**: Works on mobile and desktop
- **Accessibility**: Full keyboard navigation, screen reader support
- **Data Masking**: Sensitive data properly masked in secure mode
- **Error States**: Clear error messages for validation failures

## Data Test IDs

All major interactive elements have `data-testid` attributes:
- `upload-bankA`, `upload-bankB` - File picker areas
- `select-bankA`, `select-bankB` - Select files buttons
- `add-more-bankA`, `add-more-bankB` - Add more files buttons
- `remove-bankA-0`, `remove-bankB-0` - Remove individual file buttons
- `clear-bankA`, `clear-bankB` - Clear all files buttons
- `start-run` - Start run button
- `secure-badge` - Secure mode indicator
- `run-id` - Run ID copy button
- `profile-bankA`, `profile-bankB` - Profile containers
- `toggle-sample-bankA`, `toggle-sample-bankB` - Sample view toggles

