const { getCollections } = require("../utils/handleCollection");

const paginationMiddleware = (collectionName, pipelineStage) => {
  return async (req, res, next) => {
    try {
      const { [collectionName]: collection } = await getCollections();
     
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;

      const sortBy = req.query.sortBy || "date";
      const sortOrder = parseInt(req.query.sortOrder) || 1;

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      const aggregationPipeline = [
        ...pipelineStage(req),
        {
          $facet: {
            paginationresult: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              { $sort: sortOptions },
            ],
          },
        },
      ];

      const [result] = await collection
        .aggregate(aggregationPipeline)
        .toArray();

      const paginationResult = result.paginationresult;
      const totalCount = paginationResult.length;

      req.pagination = { paginationResult, totalCount };
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = paginationMiddleware;
