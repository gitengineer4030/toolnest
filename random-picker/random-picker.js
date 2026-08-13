
document.addEventListener('DOMContentLoaded', () => {
    const pickerTypeSelect = document.getElementById('pickerType');
    const numberOptions = document.getElementById('numberOptions');
    const listOptions = document.getElementById('listOptions');
    const minNumInput = document.getElementById('minNum');
    const maxNumInput = document.getElementById('maxNum');
    const itemsListTextarea = document.getElementById('itemsList');
    const pickBtn = document.getElementById('pickBtn');
    const resultContainer = document.getElementById('resultContainer');
    const resultDisplay = document.getElementById('result');

    pickerTypeSelect.addEventListener('change', () => {
        if (pickerTypeSelect.value === 'number') {
            numberOptions.classList.remove('hidden');
            listOptions.classList.add('hidden');
        } else {
            numberOptions.classList.add('hidden');
            listOptions.classList.remove('hidden');
        }
    });

    pickBtn.addEventListener('click', () => {
        let result = '';
        if (pickerTypeSelect.value === 'number') {
            const min = parseInt(minNumInput.value);
            const max = parseInt(maxNumInput.value);
            if (isNaN(min) || isNaN(max) || min > max) {
                alert('Please enter valid min and max numbers.');
                return;
            }
            result = Math.floor(Math.random() * (max - min + 1)) + min;
        } else {
            const items = itemsListTextarea.value.split('\n').map(item => item.trim()).filter(item => item !== '');
            if (items.length === 0) {
                alert('Please enter items in the list.');
                return;
            }
            const randomIndex = Math.floor(Math.random() * items.length);
            result = items[randomIndex];
        }
        resultDisplay.textContent = result;
        resultContainer.classList.remove('hidden');
    });

    // Initial state
    pickerTypeSelect.dispatchEvent(new Event('change'));
});


