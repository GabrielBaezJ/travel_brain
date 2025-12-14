(function () {
  document.addEventListener('DOMContentLoaded', async () => {
    const tripSelect = document.getElementById('budgetTripSelect');
    const budgetInput = document.getElementById('tripBudget');
    const saveBudgetBtn = document.getElementById('saveBudgetBtn');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const descInput = document.getElementById('expenseDesc');
    const amountInput = document.getElementById('expenseAmount');

    // Configurar validaciones
    const budgetRules = {
      trip: { required: true },
      budget: { required: true, positiveNumber: true }
    };

    const expenseRules = {
      expenseDesc: { required: true, minLength: 2, maxLength: 100 },
      expenseAmount: { required: true, positiveNumber: true }
    };

    // Configurar validación en tiempo real
    if (window.ValidationUtils) {
      // Para el formulario de presupuesto
      const budgetForm = document.querySelector('#budgetTripSelect').closest('section');
      if (budgetForm) {
        window.ValidationUtils.setupRealTimeValidation(budgetForm, budgetRules);
      }
      
      // Para el formulario de gastos
      const expenseForm = document.querySelector('#expenseDesc').closest('section');
      if (expenseForm) {
        window.ValidationUtils.setupRealTimeValidation(expenseForm, expenseRules);
      }
    }

    // Cargar viajes
    if (window.app?.populateTripSelect) {
      await window.app.populateTripSelect('budgetTripSelect');
    }

    // Guardar presupuesto
    saveBudgetBtn.addEventListener('click', () => {
      const tripId = tripSelect.value;
      const amount = parseFloat(budgetInput.value) || 0;

      // Validaciones
      if (!tripId) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Por favor, selecciona un viaje');
          tripSelect.classList.add('invalid', 'shake');
          setTimeout(() => tripSelect.classList.remove('shake'), 500);
        } else {
          alert('Selecciona un viaje');
        }
        tripSelect.focus();
        return;
      }

      if (!budgetInput.value || isNaN(amount) || amount < 0) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('El presupuesto debe ser un número positivo');
          budgetInput.classList.add('invalid', 'shake');
          setTimeout(() => budgetInput.classList.remove('shake'), 500);
        } else {
          alert('Ingresa un presupuesto válido');
        }
        budgetInput.focus();
        return;
      }

      // Mostrar indicador de carga
      const originalText = saveBudgetBtn.textContent;
      saveBudgetBtn.disabled = true;
      saveBudgetBtn.textContent = 'Guardando...';

      try {
        if (window.app?.saveBudget) {
          window.app.saveBudget(tripId, amount);
          if (window.ValidationUtils) {
            window.ValidationUtils.showSuccess('Presupuesto guardado exitosamente');
          }
          // Limpiar errores de validación
          tripSelect.classList.remove('invalid');
          budgetInput.classList.remove('invalid');
        }
        
        if (window.app?.renderBudget) {
          window.app.renderBudget(tripId);
        }
      } catch (error) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Error al guardar el presupuesto');
        } else {
          alert('Error al guardar el presupuesto');
        }
      } finally {
        // Restaurar botón
        saveBudgetBtn.disabled = false;
        saveBudgetBtn.textContent = originalText;
      }
    });

    // Agregar gasto
    addExpenseBtn.addEventListener('click', () => {
      const tripId = tripSelect.value;
      const desc = (descInput.value || '').trim();
      const amt = parseFloat(amountInput.value) || 0;

      // Validaciones
      if (!tripId) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Por favor, selecciona un viaje primero');
          tripSelect.classList.add('invalid', 'shake');
          setTimeout(() => tripSelect.classList.remove('shake'), 500);
        } else {
          alert('Selecciona un viaje');
        }
        tripSelect.focus();
        return;
      }

      if (!desc || desc.length < 2) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('La descripción del gasto es obligatoria (mín. 2 caracteres)');
          descInput.classList.add('invalid', 'shake');
          setTimeout(() => descInput.classList.remove('shake'), 500);
        } else {
          alert('Describe el gasto');
        }
        descInput.focus();
        return;
      }

      if (!amountInput.value || isNaN(amt) || amt <= 0) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('El monto debe ser un número positivo mayor a 0');
          amountInput.classList.add('invalid', 'shake');
          setTimeout(() => amountInput.classList.remove('shake'), 500);
        } else {
          alert('Ingresa un monto válido');
        }
        amountInput.focus();
        return;
      }

      // Mostrar indicador de carga
      const originalText = addExpenseBtn.textContent;
      addExpenseBtn.disabled = true;
      addExpenseBtn.textContent = 'Agregando...';

      try {
        if (window.app?.addExpense) {
          window.app.addExpense(tripId, { desc, amt });
          if (window.ValidationUtils) {
            window.ValidationUtils.showSuccess('Gasto agregado exitosamente');
          }
          
          // Limpiar campos y errores
          descInput.value = '';
          amountInput.value = '';
          descInput.classList.remove('invalid');
          amountInput.classList.remove('invalid');
        }

        if (window.app?.renderBudget) {
          window.app.renderBudget(tripId);
        }
      } catch (error) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Error al agregar el gasto');
        } else {
          alert('Error al agregar el gasto');
        }
      } finally {
        // Restaurar botón
        addExpenseBtn.disabled = false;
        addExpenseBtn.textContent = originalText;
      }
    });

    // Cambio de viaje
    tripSelect.addEventListener('change', (e) => {
      window.app?.renderBudget && window.app.renderBudget(e.target.value);
    });
  });
})();
