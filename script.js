const canvas = document.getElementById('chessboard');
const ctx = canvas.getContext('2d');
let gridSize = 25;
let rows = 25;
let cols = 40;
let margin = 40;
let selectedCells = [];
let isDragging = false;
let startCell = null;
let lastCell = null;
let currentSeatType = 'standard';
let isErasing = false;

let seatTypes = {
    standard: { name: 'Standard', color: '#3b82f6' }
};

function updateCanvasSize() {
    const canvasWidth = cols * gridSize + margin * 2;
    const canvasHeight = rows * gridSize + margin * 2;
    
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * ratio;
    canvas.height = canvasHeight * ratio;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    ctx.scale(ratio, ratio);
    
    const totalCells = rows * cols;
    const qualityInfo = document.getElementById('qualityInfo');
    if (totalCells > 2000 && gridSize < 20) {
        qualityInfo.style.display = 'block';
    } else {
        qualityInfo.style.display = 'none';
    }
}

function updateGridSize() {
    gridSize = parseInt(document.getElementById('gridSize').value);
    document.getElementById('gridSizeValue').textContent = gridSize + ' پیکسل';
    updateCanvasSize();
    drawGrid();
}

function updateGrid() {
    const newRows = parseInt(document.getElementById('rows').value);
    const newCols = parseInt(document.getElementById('cols').value);
    
    if (newRows >= 5 && newRows <= 100 && newCols >= 5 && newCols <= 100) {
        rows = newRows;
        cols = newCols;
        
        selectedCells = selectedCells.filter(cell => 
            cell.row < rows && cell.col < cols
        );
        
        updateCanvasSize();
        drawGrid();
        generateMatrix();
        showToast('ابعاد ماتریس تغییر کرد');
    } else {
        showToast('ابعاد نامعتبر! (5-100)', 'error');
    }
}

function addSeatType() {
    const typeName = document.getElementById('typeName').value.trim();
    const typeColor = document.getElementById('typeColor').value;
    
    if (!typeName) {
        showToast('نام نوع صندلی را وارد کنید', 'error');
        return;
    }
    
    if (seatTypes[typeName.toLowerCase()]) {
        showToast('این نوع قبلاً تعریف شده است', 'error');
        return;
    }
    
    const typeKey = typeName.toLowerCase().replace(/\s+/g, '_');
    seatTypes[typeKey] = { name: typeName, color: typeColor };
    
    updateTypeButtons();
    updateLegend();
    
    document.getElementById('typeName').value = '';
    showToast(`نوع "${typeName}" اضافه شد`);
}

function deleteSeatType(typeKey) {
    if (typeKey === 'standard') {
        showToast('نمی‌توان نوع پیش‌فرض را حذف کرد', 'error');
        return;
    }
    
    delete seatTypes[typeKey];
    
    selectedCells = selectedCells.filter(cell => cell.type !== typeKey);
    
    if (currentSeatType === typeKey) {
        currentSeatType = 'standard';
    }
    
    updateTypeButtons();
    updateLegend();
    drawGrid();
    generateMatrix();
    showToast('نوع صندلی حذف شد');
}

function updateTypeButtons() {
    const container = document.getElementById('typeButtons');
    container.innerHTML = '';
    
    Object.entries(seatTypes).forEach(([key, type]) => {
        const button = document.createElement('button');
        button.className = `type-btn ${currentSeatType === key ? 'active' : ''}`;
        button.dataset.type = key;
        button.style.background = type.color;
        
        button.innerHTML = `
            <span>${type.name}</span>
            ${key !== 'standard' ? `<button class="delete-type-btn" onclick="event.stopPropagation(); deleteSeatType('${key}')">×</button>` : ''}
        `;
        
        button.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            currentSeatType = key;
        });
        
        container.appendChild(button);
    });
}

function updateLegend() {
    const legend = document.getElementById('legend');
    legend.innerHTML = `
        <div class="legend-item">
            <div class="legend-color empty"></div>
            <span>خالی</span>
        </div>
    `;
    
    Object.entries(seatTypes).forEach(([key, type]) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <div class="legend-color" style="background: ${type.color};"></div>
            <span>${type.name}</span>
        `;
        legend.appendChild(item);
    });
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseFontSize = Math.max(8, Math.min(gridSize * 0.6, 18));
    const numberFontSize = Math.max(6, Math.min(gridSize * 0.45, 14));
    
    ctx.font = `${baseFontSize}px Vazirmatn, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (gridSize >= 18) {
        const stepX = Math.max(1, Math.ceil(cols / 15));
        for (let j = 0; j < cols; j++) {
            if ((j + 1) % stepX === 0 || j === 0 || j === cols - 1) {
                ctx.fillText(j + 1, margin + j * gridSize + gridSize / 2, margin - 15);
            }
        }

        ctx.textAlign = 'center';
        const stepY = Math.max(1, Math.ceil(rows / 15));
        for (let i = 0; i < rows; i++) {
            if ((i + 1) % stepY === 0 || i === 0 || i === rows - 1) {
                ctx.fillText(i + 1, margin - 15, margin + i * gridSize + gridSize / 2);
            }
        }
    }


    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = margin + j * gridSize;
            const y = margin + i * gridSize;
            
            ctx.strokeRect(x, y, gridSize, gridSize);
        }
    }


    selectedCells.forEach(cell => {
        const x = margin + cell.col * gridSize;
        const y = margin + cell.row * gridSize;
        
        const seatType = seatTypes[cell.type];
        ctx.fillStyle = seatType ? seatType.color : seatTypes.standard.color;
        ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
        
        if (gridSize >= 16) {
            ctx.fillStyle = 'white';
            ctx.font = `bold ${numberFontSize}px Vazirmatn, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillText(cell.number, x + gridSize / 2, y + gridSize / 2);
            
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
    });
    
    updateStats();
}

function getCellFromMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX / (window.devicePixelRatio || 1) - margin;
    const y = (e.clientY - rect.top) * scaleY / (window.devicePixelRatio || 1) - margin;

    return {
        row: Math.floor(y / gridSize),
        col: Math.floor(x / gridSize)
    };
}

function addSingleSeat(row, col) {
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
        const existingIndex = selectedCells.findIndex(cell => 
            cell.row === row && cell.col === col
        );
        
        if (existingIndex !== -1) {
            const removedCell = selectedCells[existingIndex];
            selectedCells.splice(existingIndex, 1);
            
            selectedCells
                .filter(c => c.row === removedCell.row && c.number > removedCell.number)
                .forEach(c => c.number--);
        } else {
            const cellsInRow = selectedCells.filter(cell => cell.row === row);
            selectedCells.push({
                row,
                col,
                id: `seat-${row + 1}-${cellsInRow.length + 1}`,
                number: cellsInRow.length + 1,
                type: currentSeatType
            });
        }
    }
}

function selectCellsBetween(start, end) {
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endCol = Math.max(start.col, end.col);

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            if (row >= 0 && row < rows && col >= 0 && col < cols) {
                if (isErasing) {
                    const cellIndex = selectedCells.findIndex(cell => 
                        cell.row === row && cell.col === col
                    );
                    if (cellIndex !== -1) {
                        const removedCell = selectedCells[cellIndex];
                        selectedCells.splice(cellIndex, 1);
                        
                        selectedCells
                            .filter(c => c.row === removedCell.row && c.number > removedCell.number)
                            .forEach(c => c.number--);
                    }
                } else {
                    if (!selectedCells.some(cell => cell.row === row && cell.col === col)) {
                        const cellsInRow = selectedCells.filter(cell => cell.row === row);
                        selectedCells.push({
                            row,
                            col,
                            id: `seat-${row + 1}-${cellsInRow.length + 1}`,
                            number: cellsInRow.length + 1,
                            type: currentSeatType
                        });
                    }
                }
            }
        }
    }
}

function updateStats() {
    document.getElementById('selectedCount').textContent = selectedCells.length;
    const uniqueRows = new Set(selectedCells.map(cell => cell.row));
    document.getElementById('rowCount').textContent = uniqueRows.size;
}

function clearAll() {
    selectedCells = [];
    drawGrid();
    generateMatrix();
}

function uploadMatrix(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
        showToast('فقط فایل‌های JSON قابل قبول هستند', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const matrixData = JSON.parse(e.target.result);
            
            if (!Array.isArray(matrixData)) {
                throw new Error('فرمت ماتریس نامعتبر است');
            }

            selectedCells = [];
            
            const foundTypes = new Set();
            let maxRow = 0;
            let maxCol = 0;

            matrixData.forEach((row, rowIndex) => {
                if (row && Array.isArray(row)) {
                    maxRow = Math.max(maxRow, rowIndex + 1);
                    row.forEach((cell, colIndex) => {
                        if (cell && typeof cell === 'object') {
                            maxCol = Math.max(maxCol, colIndex + 1);
                            
                            selectedCells.push({
                                row: rowIndex,
                                col: colIndex,
                                id: cell.id || `seat-${rowIndex + 1}-${cell.number || colIndex + 1}`,
                                number: cell.number || selectedCells.filter(c => c.row === rowIndex).length + 1,
                                type: cell.type || 'standard'
                            });

                            if (cell.type && cell.type !== 'standard') {
                                foundTypes.add(cell.type);
                            }
                        }
                    });
                }
            });

            if (maxRow > 0 && maxCol > 0) {
                rows = Math.min(Math.max(maxRow, 5), 100);
                cols = Math.min(Math.max(maxCol, 5), 100);
                
                document.getElementById('rows').value = rows;
                document.getElementById('cols').value = cols;
            }

            foundTypes.forEach(typeKey => {
                if (!seatTypes[typeKey]) {
                    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'];
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    
                    seatTypes[typeKey] = {
                        name: typeKey.charAt(0).toUpperCase() + typeKey.slice(1),
                        color: randomColor
                    };
                }
            });

            updateCanvasSize();
            updateTypeButtons();
            updateLegend();
            drawGrid();
            generateMatrix();
            
            showToast(`ماتریس با موفقیت بارگذاری شد (${selectedCells.length} صندلی)`);
            
        } catch (error) {
            console.error('خطا در بارگذاری فایل:', error);
            showToast('خطا در بارگذاری فایل. فرمت JSON معتبر نیست', 'error');
        }
    };

    reader.onerror = function() {
        showToast('خطا در خواندن فایل', 'error');
    };

    reader.readAsText(file);
    
    event.target.value = '';
}

function exportMatrix() {
    const matrix = generateMatrixData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(matrix, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "seat_matrix.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('فایل دانلود شد');
}

function copyToClipboard() {
    const matrix = generateMatrixData();
    const jsonText = JSON.stringify(matrix, null, 2);
    navigator.clipboard.writeText(jsonText).then(() => {
        showToast('JSON کپی شد');
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''} show`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

function generateMatrixData() {
    const matrix = Array(rows).fill(null).map(() => Array(cols).fill(null));

    selectedCells.forEach(cell => {
        matrix[cell.row][cell.col] = {
            id: cell.id,
            number: cell.number,
            type: cell.type
        };
    });

    return matrix.map(row => {
        const hasSelectedCells = row.some(cell => cell !== null);
        if (!hasSelectedCells) return null;

        let lastIndex = row.length - 1;
        while (lastIndex >= 0 && row[lastIndex] === null) {
            lastIndex--;
        }

        return row.slice(0, lastIndex + 1);
    }).filter(row => row !== null);
}

function generateMatrix() {
    const cleanMatrix = generateMatrixData();
    const jsonOutput = JSON.stringify(cleanMatrix, null, 2);
    document.getElementById('output').textContent = jsonOutput;
}

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startCell = getCellFromMouse(e);
    isErasing = e.shiftKey;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        lastCell = getCellFromMouse(e);
        const tempSelected = [...selectedCells];
        selectCellsBetween(startCell, lastCell);
        drawGrid();
        selectedCells = tempSelected;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (isDragging) {
        lastCell = getCellFromMouse(e);
        
        if (startCell && lastCell && 
            startCell.row === lastCell.row && 
            startCell.col === lastCell.col) {
            addSingleSeat(startCell.row, startCell.col);
        } else {
            selectCellsBetween(startCell, lastCell);
        }
        
        isDragging = false;
        isErasing = false;
        drawGrid();
        generateMatrix();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    updateCanvasSize();
    updateTypeButtons();
    updateLegend();
    drawGrid();
}); 