import { Request, Response} from 'express';
import knex from '../db/conn';

class PointsController {
  async index(req: Request, res: Response) {
    const { city, uf, items } = req.query;

    const parsedItems = String(items).split(',').map(i => Number(i.trim()));
    const points = await knex('points')
      .join('points_items', 'points.id', '=', 'points_items.point_id')
      .whereIn('points_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*');

    const serializedItems = points.map(point => {
      return {
        ...point,
        image_url: `http://192.168.100.4:3333/uploads/${point.image}`
      }
    });
    
    return res.json(serializedItems);
  };

  async create(req: Request, res: Response) {
    const { name, email, whatsapp, latitude, longitude, city, uf, items } = req.body;
    const trx = await knex.transaction();
    const point = {
      image: req.file.filename,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf
    };
    
    const insertIds = await trx('points').insert(point);
    const point_id = insertIds[0];
    const pointItems = items
      .split(',')
      .map((items: string) => Number(items.trim()))
      .map((item_id: number) => {
        return { item_id, point_id }
      }
    );
    await trx('points_items').insert(pointItems);
    await trx.commit();
    return res.json({ id: point_id, ...point });
  };

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const point = await knex('points').where('id', id).first();

    if (!point) {
      return res.status(400).json({message: 'Ponto não econtrado'});
    }
    const items = await knex('items')
      .join('points_items', 'items.id', '=', 'points_items.item_id')
      .where('points_items.point_id', id)
      .select('items.title');

    const serializedItems = {
      ...point,
      image_url: `http://192.168.100.4:3333/uploads/${point.image}`
    };
    return res.send({ ...serializedItems, items});
  };
};

export default PointsController;