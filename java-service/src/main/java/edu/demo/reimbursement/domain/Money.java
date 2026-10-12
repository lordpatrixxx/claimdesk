package edu.demo.reimbursement.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Small helper for rupee amounts. All money uses BigDecimal with 2 decimals —
 * never double or float, because 0.1 + 0.2 is not exactly 0.3 in floating point.
 */
public final class Money {

    public static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);
    public static final BigDecimal MAX_ITEM_AMOUNT = new BigDecimal("100000.00");

    private Money() { }

    public static BigDecimal of(String value) {
        return normalize(new BigDecimal(value));
    }

    public static BigDecimal normalize(BigDecimal value) {
        if (value == null) {
            throw new IllegalArgumentException("Amount is required");
        }
        if (value.scale() > 2 && value.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("Amount cannot have more than 2 decimal places: " + value.toPlainString());
        }
        return value.setScale(2, RoundingMode.UNNECESSARY);
    }
}
