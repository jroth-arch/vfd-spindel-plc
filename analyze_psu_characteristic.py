"""
Analýza charakteristiky laboratorního zdroje
Určí přesné parametry pro linearizaci mapování proud -> napětí
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Načtení dat
data = np.genfromtxt('docs/labpsu_charakteristika.csv', 
                     delimiter='\t', 
                     skip_header=1)

voltage = data[:, 0]  # U_ctrl [V]
current = data[:, 1]  # I_out [A]

print("=" * 60)
print("ANALÝZA CHARAKTERISTIKY LABORATORNÍHO ZDROJE")
print("=" * 60)
print(f"\nNaměřeno bodů: {len(voltage)}")
print(f"Rozsah napětí: {voltage.min():.2f} - {voltage.max():.2f} V")
print(f"Rozsah proudu: {current.min():.1f} - {current.max():.1f} A")

# Lineární regrese: I = a*U + b
slope, intercept, r_value, p_value, std_err = stats.linregress(voltage, current)

print(f"\n--- LINEÁRNÍ REGRESE ---")
print(f"I [A] = {slope:.2f} * U [V] + ({intercept:.2f})")
print(f"R² = {r_value**2:.6f}  (perfektní fit = 1.0)")
print(f"Směrodatná odchylka: {std_err:.3f}")

# Určení dead-zone (kde začíná reakce)
# Inverzní vztah: U = (I - b) / a
# Pro I=0 A -> U_min

U_min_calculated = -intercept / slope if slope > 0 else 0
print(f"\nDEAD ZONE (vypočtený): U_min = {U_min_calculated:.3f} V")
print(f"DEAD ZONE (naměřený):  U_min ≈ {voltage.min():.2f} V")

# Extrapolace do plného rozsahu 0-60A
I_max = 60.0  # Maximální proud zdroje
U_at_60A = (I_max - intercept) / slope

print(f"\n--- EXTRAPOLACE ---")
print(f"Pro I = 60 A očekáváme U_ctrl ≈ {U_at_60A:.2f} V")
if U_at_60A > 5.0:
    print(f"⚠️  POZOR: Pro 60A je potřeba {U_at_60A:.2f}V, ale max je 5V!")
    I_at_5V = slope * 5.0 + intercept
    print(f"    Při 5V dosáhnete max {I_at_5V:.1f} A")

# Inverzní vztah (pro PLC implementaci)
# Chceme: I [A] -> U_ctrl [V]
# U_ctrl = (I - b) / a = I/a - b/a
a_inv = 1.0 / slope
b_inv = -intercept / slope

print(f"\n--- INVERZNÍ VZTAH (pro PLC) ---")
print(f"U_ctrl [V] = {a_inv:.6f} * I [A] + {b_inv:.4f}")
print(f"Nebo:        U_ctrl = I / {slope:.2f} + {b_inv:.4f}")

# Test příkladů
print(f"\n--- TESTOVACÍ HODNOTY ---")
for I_test in [0, 10, 30, 60]:
    U_test = a_inv * I_test + b_inv
    print(f"I = {I_test:2d} A  ->  U_ctrl = {U_test:.3f} V")

# Vizualizace
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Graf 1: Naměřená charakteristika + fit
ax1.plot(voltage, current, 'o', label='Naměřené body', markersize=4)
U_fit = np.linspace(voltage.min(), voltage.max(), 100)
I_fit = slope * U_fit + intercept
ax1.plot(U_fit, I_fit, 'r-', label=f'Lineární fit (R²={r_value**2:.5f})', linewidth=2)

# Extrapolace
U_extrap = np.linspace(0, 5, 100)
I_extrap = slope * U_extrap + intercept
ax1.plot(U_extrap, I_extrap, 'r--', label='Extrapolace do 5V', alpha=0.5)

ax1.axvline(U_min_calculated, color='green', linestyle='--', alpha=0.7, label=f'Dead zone: {U_min_calculated:.3f}V')
ax1.axhline(60, color='orange', linestyle='--', alpha=0.7, label='Max proud zdroje (60A)')

ax1.set_xlabel('Řídicí napětí U_ctrl [V]', fontsize=12)
ax1.set_ylabel('Výstupní proud I [A]', fontsize=12)
ax1.set_title('Charakteristika zdroje: I = f(U)', fontsize=14, fontweight='bold')
ax1.grid(True, alpha=0.3)
ax1.legend()
ax1.set_xlim(0, 5.5)
ax1.set_ylim(-5, 70)

# Graf 2: Inverzní vztah (pro PLC)
I_range = np.linspace(0, 60, 100)
U_range = a_inv * I_range + b_inv

ax2.plot(I_range, U_range, 'b-', linewidth=2, label='Inverzní vztah (PLC mapování)')
ax2.plot(current, voltage, 'o', markersize=4, alpha=0.6, label='Naměřené body')

ax2.axhline(U_min_calculated, color='green', linestyle='--', alpha=0.7, label=f'Dead zone: {U_min_calculated:.3f}V')
ax2.axhline(5.0, color='red', linestyle='--', alpha=0.7, label='Max U_ctrl (5V)')

ax2.set_xlabel('Požadovaný proud I [A]', fontsize=12)
ax2.set_ylabel('Řídicí napětí U_ctrl [V]', fontsize=12)
ax2.set_title('Inverzní vztah: U_ctrl = f(I)  [pro PLC]', fontsize=14, fontweight='bold')
ax2.grid(True, alpha=0.3)
ax2.legend()
ax2.set_xlim(-2, 65)
ax2.set_ylim(0, 5.5)

plt.tight_layout()
plt.savefig('docs/labpsu_analyza.png', dpi=150, bbox_inches='tight')
print(f"\n✅ Graf uložen: docs/labpsu_analyza.png")

# Reziduály (kontrola kvality fitu)
residuals = current - (slope * voltage + intercept)
fig2, ax = plt.subplots(figsize=(10, 4))
ax.plot(voltage, residuals, 'o', markersize=4)
ax.axhline(0, color='red', linestyle='--', linewidth=1)
ax.set_xlabel('Napětí U_ctrl [V]')
ax.set_ylabel('Reziduum [A]')
ax.set_title('Reziduály (odchylka od lineárního fitu)')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('docs/labpsu_residuals.png', dpi=150, bbox_inches='tight')
print(f"✅ Reziduály: docs/labpsu_residuals.png")

print("\n" + "=" * 60)
print("DOPORUČENÍ PRO IMPLEMENTACI")
print("=" * 60)

print(f"""
Pro FB_LabPSU v SCL použijte tyto parametry:

// Dead zone offset
PSU_DeadZone_V := {U_min_calculated:.4f};  // [V]

// Lineární mapování: U_ctrl = (I_A / slope) + offset
PSU_CurrentToVoltage_Slope := {slope:.4f};  // [A/V]
PSU_VoltageOffset := {b_inv:.4f};           // [V]

// Přepočet:
#AQ3_CurrentCtrl_V := (#CurrentSet_A / {slope:.4f}) + {b_inv:.4f};

// Nebo s explicitním dead-zone:
IF #CurrentSet_A > 0.0 THEN
    #AQ3_CurrentCtrl_V := (#CurrentSet_A / {slope:.4f}) + {b_inv:.4f};
ELSE
    #AQ3_CurrentCtrl_V := 0.0;
END_IF;

// Clamp na rozsah 0-5V
IF #AQ3_CurrentCtrl_V < {U_min_calculated:.4f} THEN
    #AQ3_CurrentCtrl_V := {U_min_calculated:.4f};
END_IF;
IF #AQ3_CurrentCtrl_V > 5.0 THEN
    #AQ3_CurrentCtrl_V := 5.0;
END_IF;
""")

print("=" * 60)
