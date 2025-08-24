export const generatePaginationQuery = (query: any, sort: any, nextKey: any) => {
  const sortField = sort === null ? null : sort[0];

  const nextKeyFn = (items: any) => {
    if (items.length === 0) {
      return null;
    }
    const item = items[items.length - 1];

    if (sortField === null) {
      return { _id: item._id };
    }

    return { _id: item._id, [sortField]: item[sortField] };
  };

  // Handle empty or null query
  const baseQuery = query || {};

  if (nextKey === null || nextKey === undefined) {
    return { paginatedQuery: baseQuery, nextKeyFn };
  }

  let paginatedQuery = baseQuery;

  if (sort === null) {
    paginatedQuery._id = { $gt: nextKey._id };
    return { paginatedQuery, nextKeyFn };
  }

  const sortOperator = sort[1] === 1 ? '$gt' : '$lt';

  console.log('Pagination - sortField:', sortField, 'sortOperator:', sortOperator);
  console.log('Pagination - nextKey:', nextKey);

  const paginationQuery = [
    { [sortField]: { [sortOperator]: nextKey[sortField] } },
    { $and: [{ [sortField]: nextKey[sortField] }, { _id: { [sortOperator]: nextKey._id } }] },
  ];

  console.log('Pagination - paginationQuery:', JSON.stringify(paginationQuery, null, 2));

  if (!paginatedQuery.$or && Object.keys(baseQuery).length === 0) {
    // No existing filters, just use pagination
    paginatedQuery = { $or: paginationQuery };
  } else {
    // Combine existing filters with pagination
    paginatedQuery = { $and: [baseQuery, { $or: paginationQuery }] };
  }

  return { paginatedQuery, nextKeyFn };
};
