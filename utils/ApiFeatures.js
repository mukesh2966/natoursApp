class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => {
      delete queryObj[el];
    });
    // console.log(queryObj);
    let queryString1 = JSON.stringify(queryObj);
    queryString1 = queryString1.replace(/\b(gte|gt|lte|lt)\b/g, (match) => {
      return `$${match}`;
    });
    // console.log(queryString1);

    this.query = this.query.find(JSON.parse(queryString1));

    return this; // returning the entire object
  }

  sort() {
    if (this.queryString.sort) {
      // console.log(this.queryString.sort);
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy); // here sortBy is actually 'price -ratingsAverage'
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this; // returning the entire object
  }

  limitFields() {
    // 3) FIELD LIMITING/Projecting -------------------------------
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this; // returning the entire object
  }

  paginate() {
    // 4) PAGINATION ---------------------------------------------

    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // skip is the number of documents to skip before reading this page
    // limit the no. of documents on one page
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = ApiFeatures;
