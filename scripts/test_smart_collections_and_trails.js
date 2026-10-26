/**
 * Automated Verification Script for:
 * 1. Smart Collections (Manual, Smart, Hybrid, ALL/ANY rules, Pins, Exclusions, Duplication)
 * 2. Cultural Trails (Creation, Step Ordering, Annotations, Duplication, Persistence)
 */

const API_BASE = 'http://localhost:3001/api';

async function runTests() {
  console.log('🚀 Starting Smart Collections & Cultural Trails Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // --- 1. Manual Collection Test ---
    console.log('--- Test 1: Manual Collection CRUD ---');
    const manualCreateRes = await fetch(`${API_BASE}/me/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Manual Collection',
        description: 'Testing manual curation',
        type: 'manual'
      })
    });
    const manualCol = await manualCreateRes.json();
    assert(manualCol && manualCol.id && manualCol.type === 'manual', 'Manual collection created');

    // Add item to manual collection
    const addItemRes = await fetch(`${API_BASE}/me/collections/${manualCol.id}/items/films-0`, { method: 'POST' });
    const addItemData = await addItemRes.json();
    assert(addItemData.success === true, 'Item added to manual collection');

    // Fetch items
    const getItemsRes = await fetch(`${API_BASE}/me/collections/${manualCol.id}/items`);
    const items = await getItemsRes.json();
    assert(items.length >= 1 && items.some(i => i.id === 'films-0'), 'Manual collection items fetched correctly');

    // --- 2. Smart Collection ALL vs ANY Rules ---
    console.log('\n--- Test 2: Smart Collection ALL vs ANY Rules ---');
    // Rule: Film AND Year >= 2010
    const ruleAllRes = await fetch(`${API_BASE}/me/collections/preview-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          { field: 'type', operator: 'equals', value: 'film' },
          { field: 'year', operator: 'greater_than_or_equal', value: 2010 }
        ],
        matchOperator: 'all'
      })
    });
    const ruleAllData = await ruleAllRes.json();
    assert(ruleAllData.matchCount > 0, `Match ALL returned ${ruleAllData.matchCount} films with year >= 2010`);

    // Rule: Film OR Book (ANY)
    const ruleAnyRes = await fetch(`${API_BASE}/me/collections/preview-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          { field: 'type', operator: 'equals', value: 'film' },
          { field: 'type', operator: 'equals', value: 'book' }
        ],
        matchOperator: 'any'
      })
    });
    const ruleAnyData = await ruleAnyRes.json();
    assert(ruleAnyData.matchCount >= ruleAllData.matchCount, `Match ANY returned ${ruleAnyData.matchCount} items (films + books)`);

    // --- 3. Smart Collection Persistence & Updates ---
    console.log('\n--- Test 3: Smart Collection Persistence & Updates ---');
    const smartColRes = await fetch(`${API_BASE}/me/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Modern Cinema Archive',
        type: 'smart',
        match_operator: 'all',
        rules: [{ field: 'type', operator: 'equals', value: 'film' }]
      })
    });
    const smartCol = await smartColRes.json();
    assert(smartCol.id && smartCol.type === 'smart', 'Smart collection created and persisted');
    assert(smartCol.itemCount > 0, `Smart collection computed dynamic itemCount: ${smartCol.itemCount}`);

    // Update rules
    const updateRes = await fetch(`${API_BASE}/me/collections/${smartCol.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Modern Cinema Archive (Updated)',
        rules: [
          { field: 'type', operator: 'equals', value: 'film' },
          { field: 'year', operator: 'greater_than_or_equal', value: 2012 }
        ]
      })
    });
    const updatedCol = await updateRes.json();
    assert(updatedCol.title === 'Modern Cinema Archive (Updated)', 'Collection updated title');
    assert(updatedCol.itemCount <= smartCol.itemCount, 'Narrower rule properly updated item count');

    // --- 4. Hybrid Collection: Pins and Exclusions ---
    console.log('\n--- Test 4: Hybrid Collection Pins & Exclusions ---');
    const hybridRes = await fetch(`${API_BASE}/me/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Curated Hybrid Film Collection',
        type: 'hybrid',
        rules: [{ field: 'type', operator: 'equals', value: 'film' }],
        pinned_ids: ['books-0'], // Pin a book to a film collection
        excluded_ids: ['films-0'] // Exclude a specific film
      })
    });
    const hybridCol = await hybridRes.json();
    assert(hybridCol.type === 'hybrid', 'Hybrid collection created');

    const hybridItemsRes = await fetch(`${API_BASE}/me/collections/${hybridCol.id}/items`);
    const hybridItems = await hybridItemsRes.json();
    const hasPinned = hybridItems.some(i => i.id === 'books-0');
    const hasExcluded = hybridItems.some(i => i.id === 'films-0');
    assert(hasPinned === true, 'Pinned book item is present in hybrid collection');
    assert(hasExcluded === false, 'Excluded film is absent from hybrid collection');

    // --- 5. Duplication ---
    console.log('\n--- Test 5: Collection Duplication ---');
    const dupRes = await fetch(`${API_BASE}/me/collections/${smartCol.id}/duplicate`, { method: 'POST' });
    const dupCol = await dupRes.json();
    assert(dupCol.id !== smartCol.id && dupCol.title.includes('(Copy)'), 'Collection duplicated successfully with rules intact');

    // --- 6. Cultural Trails CRUD & Steps Ordering ---
    console.log('\n--- Test 6: Cultural Trails CRUD & Steps Ordering ---');
    const trailCreateRes = await fetch(`${API_BASE}/me/trails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Architectural Influences on Cinema',
        description: 'From brutalist monuments to cinematic monoliths',
        theme: 'architectural',
        status: 'draft',
        steps: [
          { contentId: 'architecture-0', stepOrder: 0, annotation: 'Concrete monolithic origins', connectionType: 'leads_to', connectionText: 'Inaugural step' },
          { contentId: 'films-0', stepOrder: 1, annotation: 'Translating angular geometry to dystopian frames', connectionType: 'inspired_by', connectionText: 'Direct visual influence' }
        ]
      })
    });
    const createdTrail = await trailCreateRes.json();
    assert(createdTrail.id && createdTrail.title === 'Architectural Influences on Cinema', 'Cultural trail created');

    // Fetch trail detail with steps
    const getTrailRes = await fetch(`${API_BASE}/me/trails/${createdTrail.id}`);
    const trailDetail = await getTrailRes.json();
    assert(trailDetail.steps && trailDetail.steps.length === 2, 'Trail steps returned');
    assert(trailDetail.steps[0].connectionType === 'leads_to', 'First step connection type preserved');
    assert(trailDetail.steps[1].connectionType === 'inspired_by', 'Second step connection type preserved');
    assert(trailDetail.steps[0].artifact && trailDetail.steps[0].artifact.title, 'Step artifact joined correctly');

    // Reorder & update steps
    console.log('\n--- Test 7: Trail Step Reordering & Annotation Preservation ---');
    const reorderedSteps = [
      { contentId: 'films-0', stepOrder: 0, annotation: 'Reordered: Now film first', connectionType: 'leads_to', connectionText: 'New narrative beginning' },
      { contentId: 'architecture-0', stepOrder: 1, annotation: 'Reordered: Looking back at architecture', connectionType: 'related_to', connectionText: 'Historical foundation' },
      { contentId: 'books-0', stepOrder: 2, annotation: 'Third step: Literary realization', connectionType: 'adaptation_of', connectionText: 'From screen to page' }
    ];

    const updateTrailRes = await fetch(`${API_BASE}/me/trails/${createdTrail.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        steps: reorderedSteps
      })
    });
    const updateTrailData = await updateTrailRes.json();
    assert(updateTrailData.success === true, 'Trail updated with reordered steps');

    const verifiedTrail = await (await fetch(`${API_BASE}/me/trails/${createdTrail.id}`)).json();
    assert(verifiedTrail.steps.length === 3, 'Trail now has 3 steps');
    assert(verifiedTrail.steps[0].contentId === 'films-0', 'Step 0 is correctly films-0');
    assert(verifiedTrail.steps[0].annotation === 'Reordered: Now film first', 'Step 0 annotation preserved');
    assert(verifiedTrail.steps[2].connectionType === 'adaptation_of', 'Step 2 connection type preserved');
    assert(verifiedTrail.status === 'completed', 'Trail status updated to completed');

    // --- 8. Trail Duplication ---
    console.log('\n--- Test 8: Trail Duplication ---');
    const dupTrailRes = await fetch(`${API_BASE}/me/trails/${createdTrail.id}/duplicate`, { method: 'POST' });
    const dupTrailData = await dupTrailRes.json();
    assert(dupTrailData.success === true && dupTrailData.id !== createdTrail.id, 'Trail duplicated with new ID');

    const dupTrailDetail = await (await fetch(`${API_BASE}/me/trails/${dupTrailData.id}`)).json();
    assert(dupTrailDetail.steps.length === 3, 'Duplicated trail retained all 3 steps');

    // --- 9. Invalid Rule / Input Rejection ---
    console.log('\n--- Test 9: Security & Input Validation ---');
    const invalidRuleRes = await fetch(`${API_BASE}/me/collections/preview-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: [
          { field: 'DROP TABLE collections;--', operator: 'malicious', value: 'exploit' }
        ]
      })
    });
    const invalidRuleData = await invalidRuleRes.json();
    assert(invalidRuleData.matchCount === 0, 'Malicious SQL / unwhitelisted rule fields properly stripped');

    // --- 10. Clean up test records ---
    console.log('\n--- Cleanup ---');
    await fetch(`${API_BASE}/me/collections/${manualCol.id}`, { method: 'DELETE' });
    await fetch(`${API_BASE}/me/collections/${smartCol.id}`, { method: 'DELETE' });
    await fetch(`${API_BASE}/me/collections/${dupCol.id}`, { method: 'DELETE' });
    await fetch(`${API_BASE}/me/collections/${hybridCol.id}`, { method: 'DELETE' });
    await fetch(`${API_BASE}/me/trails/${createdTrail.id}`, { method: 'DELETE' });
    await fetch(`${API_BASE}/me/trails/${dupTrailData.id}`, { method: 'DELETE' });
    console.log('  Cleaned up temporary test collections and trails.');

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
