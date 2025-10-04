# Suggest Mappings Feature Test

## Manual Testing Steps

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to the suggest mappings page:**
   - Go to `http://localhost:5173/mappings/suggest`
   - The page should load with 30 mapping candidates from the fixture

3. **Test the threshold slider:**
   - Default threshold should be 70%
   - Move the slider to see the impact meter update
   - Verify that rows change from "Auto" to "Review" based on threshold
   - Test keyboard navigation (arrow keys, page up/down, home/end)

4. **Test the explain popover:**
   - Click the help icon on any row
   - Verify the popover opens with match reasons and example pairs
   - Test ESC key to close the popover
   - Verify examples are masked when secure mode is ON

5. **Test decision making:**
   - Use radio buttons to approve/reject mappings
   - Verify the decision badges update
   - Test "Select all above threshold" button
   - Test "Reset decisions" button

6. **Test the impact meter:**
   - Verify it shows "Auto X% (~Y min saved)"
   - Verify the tooltip shows the review time assumption
   - Verify it updates when threshold or decisions change

7. **Test the continue button:**
   - Should be disabled when no mappings are approved
   - Should be enabled when at least one mapping is approved
   - Should show a toast when clicked

8. **Test secure mode:**
   - Set `VITE_MOCK=1` and `secureMode=true` in config
   - Verify examples are masked in explain popovers
   - Verify the secure mode badge is shown

## Expected Behavior

- Page loads in <300ms with 30+ mapping candidates
- Threshold slider works smoothly with keyboard navigation
- Impact meter updates in real-time
- Explain popovers show detailed match reasons
- Decision state persists and updates UI correctly
- Continue button only enables with approved mappings
- All interactive elements are keyboard accessible
- No network calls to public internet in mock mode

## Test Data

The fixture includes 30 realistic mapping candidates with:
- Confidence scores from 0.35 to 0.95
- Realistic column names (acct_id → account_number, etc.)
- Match reasons explaining the confidence
- Example pairs showing data transformations
- Proper masking in secure mode
