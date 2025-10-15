import { generateBatch } from './batch';

let selectedVariants: 1 | 2 | 3 = 1;

document.addEventListener('DOMContentLoaded', () => {
  const variantOptions = document.querySelectorAll('.variant-option');
  const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
  const textsInput = document.getElementById('textsInput') as HTMLTextAreaElement;
  const resultsDiv = document.getElementById('results') as HTMLDivElement;

  variantOptions.forEach(option => {
    option.addEventListener('click', () => {
      variantOptions.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selectedVariants = parseInt(option.getAttribute('data-value')!) as 1 | 2 | 3;
    });
  });

  generateBtn.addEventListener('click', async () => {
    const texts = textsInput.value
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, 10);

    if (texts.length === 0) {
      alert('Please enter at least one text');
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    resultsDiv.innerHTML = '';

    try {
      const results = await generateBatch(texts, selectedVariants);
      
      results.forEach(result => {
        const item = document.createElement('div');
        item.className = `result-item ${result.success ? 'result-success' : 'result-error'}`;
        
        if (result.success) {
          item.textContent = `✓ ${result.text} (${result.variants?.length} variant${result.variants?.length !== 1 ? 's' : ''})`;
        } else {
          item.textContent = `✗ ${result.text}: ${result.error}`;
        }
        
        resultsDiv.appendChild(item);
      });

      const successCount = results.filter(r => r.success).length;
      const totalVariants = results.reduce((sum, r) => sum + (r.variants?.length || 0), 0);
      
      alert(`Generated ${totalVariants} memes from ${successCount}/${texts.length} texts`);
    } catch (error) {
      alert('Batch generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Memes';
    }
  });
});
