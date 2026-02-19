import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { DatabaseService } from "../db/database.service";

type SimulationRequest = {
  productId: string;
  amount: number;
  termMonths: number;
  downPayment?: number;
};

@Controller("simulador-financiero")
export class FinancialController {
  constructor(private readonly db: DatabaseService) {}

  @Get("productos")
  async listProducts() {
    const rows = await this.db.query(
      `SELECT id, code, name, productType, minAmount, maxAmount, minTermMonths,
              maxTermMonths, baseRate, currency, description
       FROM sandbox_financial_products
       ORDER BY name ASC`,
    );
    return { items: rows };
  }

  @Get("productos/:id")
  async getProduct(@Param("id") id: string) {
    const rows = await this.db.query(
      `SELECT id, code, name, productType, minAmount, maxAmount, minTermMonths,
              maxTermMonths, baseRate, currency, description
       FROM sandbox_financial_products
       WHERE id = ? OR code = ?
       LIMIT 1`,
      [id, id],
    );
    if (rows.length === 0) throw new NotFoundException("Producto no encontrado");
    return rows[0];
  }

  @Post("simular")
  async simulate(@Body() body: SimulationRequest) {
    if (!body || !body.productId) {
      throw new NotFoundException("productId requerido");
    }
    const rows = await this.db.query(
      `SELECT id, code, name, productType, minAmount, maxAmount, minTermMonths,
              maxTermMonths, baseRate, currency
       FROM sandbox_financial_products
       WHERE id = ? OR code = ?
       LIMIT 1`,
      [body.productId, body.productId],
    );
    if (rows.length === 0) throw new NotFoundException("Producto no encontrado");
    const product = rows[0] as any;

    const amount = Number(body.amount || 0);
    const termMonths = Number(body.termMonths || 0);
    const downPayment = Number(body.downPayment || 0);

    const principal = Math.max(amount - downPayment, 0);
    const baseRate = Number(product.baseRate || 0);
    const riskAdj = principal > 50000 ? 0.35 : 0.15;
    const rateAnnual = baseRate + riskAdj;
    const rateMonthly = rateAnnual / 12 / 100;

    let monthlyPayment = 0;
    if (rateMonthly > 0 && termMonths > 0) {
      monthlyPayment =
        (principal * rateMonthly) / (1 - Math.pow(1 + rateMonthly, -termMonths));
    }
    const totalCost = monthlyPayment * termMonths;

    return {
      product: {
        id: product.id,
        name: product.name,
        code: product.code,
        productType: product.productType,
        currency: product.currency,
      },
      input: { amount, downPayment, termMonths },
      result: {
        principal,
        rateAnnual,
        rateMonthly,
        monthlyPayment: Number(monthlyPayment.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
      },
    };
  }
}
